import { NextResponse } from 'next/server'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { Resend } from 'resend'

const RECIPIENT_EMAIL = 'wlccoeur@gmail.com'

function sanitize(text) {
  if (!text) return ''
  return text
    .replace(/[\u{1F000}-\u{1FFFF}]/gu, '')
    .replace(/[\u{2600}-\u{27BF}]/gu, '')
    .replace(/[\u{FE00}-\u{FE0F}]/gu, '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\u2019/g, "'")
    .replace(/\u2018/g, "'")
    .replace(/\u201C/g, '"')
    .replace(/\u201D/g, '"')
    .replace(/\u2013/g, '-')
    .replace(/\u2014/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/[^\x00-\xFF]/g, '')
}

export async function POST(request) {
  try {
    const { restaurantName, languages, categories, notes } = await request.json()

    const pdfDoc = await PDFDocument.create()
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    const pageWidth = 595
    const pageHeight = 842
    const margin = 50
    const contentWidth = pageWidth - margin * 2
    let page = pdfDoc.addPage([pageWidth, pageHeight])
    let y = pageHeight - margin

    const addPage = () => { page = pdfDoc.addPage([pageWidth, pageHeight]); y = pageHeight - margin }
    const checkSpace = (needed) => { if (y - needed < margin) addPage() }

    const accent = rgb(0.769, 0.396, 0.180)
    const dark = rgb(0.106, 0.106, 0.106)
    const grey = rgb(0.478, 0.451, 0.412)

    const safeName = sanitize(restaurantName)

    page.drawRectangle({ x: 0, y: pageHeight - 100, width: pageWidth, height: 100, color: rgb(0.106, 0.106, 0.106) })
    page.drawText(safeName.toUpperCase(), { x: margin, y: pageHeight - 60, size: 24, font: helveticaBold, color: rgb(1, 1, 1) })

    const dateStr = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    const langList = languages.join(', ').toUpperCase()
    page.drawText(sanitize(`${dateStr}  |  Langues : ${langList}`), { x: margin, y: pageHeight - 82, size: 10, font: helvetica, color: rgb(0.7, 0.7, 0.7) })

    y = pageHeight - 130

    for (const cat of categories) {
      const validItems = cat.items.filter(it => it.name?.fr?.trim())
      if (validItems.length === 0) continue

      checkSpace(60)
      page.drawRectangle({ x: margin, y: y - 4, width: contentWidth, height: 28, color: rgb(0.949, 0.945, 0.937) })
      page.drawText(sanitize(cat.name.toUpperCase()), { x: margin + 10, y: y + 4, size: 12, font: helveticaBold, color: accent })
      y -= 36

      for (const item of validItems) {
        checkSpace(40)
        const name = sanitize(item.name.fr)
        const price = item.price ? `${item.price} EUR` : ''

        page.drawText(name, { x: margin + 10, y, size: 11, font: helveticaBold, color: dark })
        if (price) {
          const priceWidth = helveticaBold.widthOfTextAtSize(price, 11)
          page.drawText(price, { x: pageWidth - margin - priceWidth - 10, y, size: 11, font: helveticaBold, color: accent })
        }
        y -= 16

        if (item.description?.fr?.trim()) {
          const desc = sanitize(item.description.fr)
          const words = desc.split(' ')
          let line = ''
          for (const word of words) {
            const testLine = line ? `${line} ${word}` : word
            const testWidth = helvetica.widthOfTextAtSize(testLine, 9)
            if (testWidth > contentWidth - 20 && line) {
              checkSpace(14)
              page.drawText(line, { x: margin + 10, y, size: 9, font: helvetica, color: grey })
              y -= 14
              line = word
            } else { line = testLine }
          }
          if (line) { checkSpace(14); page.drawText(line, { x: margin + 10, y, size: 9, font: helvetica, color: grey }); y -= 14 }
        }
        y -= 6
        page.drawLine({ start: { x: margin + 10, y: y + 4 }, end: { x: pageWidth - margin - 10, y: y + 4 }, thickness: 0.5, color: rgb(0.91, 0.894, 0.867) })
        y -= 8
      }
      y -= 10
    }

    if (notes?.trim()) {
      checkSpace(60); y -= 10
      page.drawText('REMARQUES', { x: margin, y, size: 12, font: helveticaBold, color: accent }); y -= 20
      const words = sanitize(notes).split(' ')
      let line = ''
      for (const word of words) {
        const testLine = line ? `${line} ${word}` : word
        const testWidth = helvetica.widthOfTextAtSize(testLine, 10)
        if (testWidth > contentWidth && line) { checkSpace(16); page.drawText(line, { x: margin, y, size: 10, font: helvetica, color: dark }); y -= 16; line = word }
        else { line = testLine }
      }
      if (line) { page.drawText(line, { x: margin, y, size: 10, font: helvetica, color: dark }) }
    }

    const pdfBytes = await pdfDoc.save()
    const pdfBuffer = Buffer.from(pdfBytes)

    const resend = new Resend(process.env.RESEND_API_KEY)
    const totalProducts = categories.reduce((s, c) => s + c.items.filter(i => i.name?.fr?.trim()).length, 0)
    const fileName = `carte-${safeName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')}.pdf`

    await resend.emails.send({
      from: 'Menu Collector <onboarding@resend.dev>',
      to: RECIPIENT_EMAIL,
      subject: `Nouvelle carte : ${safeName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 500px;">
          <h2 style="color: #C4652E;">Nouvelle carte recue</h2>
          <p><strong>Restaurant :</strong> ${safeName}</p>
          <p><strong>Categories :</strong> ${categories.length}</p>
          <p><strong>Produits :</strong> ${totalProducts}</p>
          <p><strong>Langues :</strong> ${langList}</p>
          ${notes ? `<p><strong>Remarque :</strong> ${sanitize(notes)}</p>` : ''}
          <br>
          <p>Le PDF de la carte est en piece jointe.</p>
        </div>
      `,
      attachments: [{ filename: fileName, content: pdfBuffer }],
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Send menu error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
