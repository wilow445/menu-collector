import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const RECIPIENT_EMAIL = 'wlccoeur@gmail.com'

export async function POST(request) {
  try {
    const { restaurantName, languages, categories, notes } = await request.json()

    const resend = new Resend(process.env.RESEND_API_KEY)
    const totalProducts = categories.reduce((s, c) => s + c.items.filter(i => i.name?.fr?.trim()).length, 0)
    const dateStr = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

    let categoriesHtml = ''
    for (const cat of categories) {
      const validItems = cat.items.filter(it => it.name?.fr?.trim())
      if (validItems.length === 0) continue

      let itemsHtml = ''
      for (const item of validItems) {
        const price = item.price
          ? `<td style="text-align:right;color:#C4652E;font-weight:700;font-size:15px;white-space:nowrap;padding-left:12px;">${item.price} &euro;</td>`
          : '<td></td>'
        const desc = item.description?.fr?.trim()
          ? `<tr><td colspan="2" style="color:#7A7368;font-size:13px;padding:2px 0 10px 0;">${item.description.fr}</td></tr>`
          : ''
        itemsHtml += `
          <tr style="border-bottom:1px solid #E8E4DD;">
            <td style="font-weight:600;font-size:15px;padding:10px 0 ${desc ? '2' : '10'}px 0;">${item.name.fr}</td>
            ${price}
          </tr>
          ${desc}`
      }

      categoriesHtml += `
        <div style="margin-bottom:28px;">
          <div style="background:#F3F0EB;padding:10px 16px;border-radius:8px;margin-bottom:8px;">
            <strong style="color:#C4652E;text-transform:uppercase;font-size:13px;letter-spacing:0.5px;">${cat.name}</strong>
            <span style="color:#B5AFA6;font-size:12px;margin-left:8px;">${validItems.length} produit${validItems.length > 1 ? 's' : ''}</span>
          </div>
          <table style="width:100%;border-collapse:collapse;padding:0 4px;">
            ${itemsHtml}
          </table>
        </div>`
    }

    const notesHtml = notes?.trim()
      ? `<div style="margin-top:24px;padding:14px 16px;background:#FFF8F0;border-radius:8px;border-left:4px solid #C4652E;">
           <strong style="font-size:13px;">Remarque :</strong>
           <div style="margin-top:4px;color:#1B1B1B;">${notes}</div>
         </div>`
      : ''

    const html = `
      <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;color:#1B1B1B;">
        <div style="background:#1B1B1B;padding:28px 30px;border-radius:12px 12px 0 0;">
          <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700;">${restaurantName}</h1>
          <p style="color:#999;margin:8px 0 0;font-size:13px;">${dateStr}</p>
        </div>

        <div style="padding:24px 30px;background:#FFFFFF;border:1px solid #E8E4DD;border-top:none;">
          <table style="width:100%;margin-bottom:20px;font-size:14px;">
            <tr>
              <td style="padding:6px 0;color:#7A7368;">Cat&eacute;gories</td>
              <td style="padding:6px 0;font-weight:600;text-align:right;">${categories.filter(c => c.items.some(i => i.name?.fr?.trim())).length}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#7A7368;">Produits</td>
              <td style="padding:6px 0;font-weight:600;text-align:right;">${totalProducts}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#7A7368;">Langues</td>
              <td style="padding:6px 0;font-weight:600;text-align:right;">${languages.join(', ').toUpperCase()}</td>
            </tr>
          </table>

          <div style="border-top:2px solid #E8E4DD;padding-top:20px;">
            ${categoriesHtml}
          </div>

          ${notesHtml}
        </div>

        <div style="padding:16px 30px;background:#F3F0EB;border:1px solid #E8E4DD;border-top:none;border-radius:0 0 12px 12px;font-size:12px;color:#7A7368;">
          Envoy&eacute; via Menu Collector &middot; ${dateStr}
        </div>
      </div>`

    await resend.emails.send({
      from: 'Menu Collector <onboarding@resend.dev>',
      to: RECIPIENT_EMAIL,
      subject: `Nouvelle carte : ${restaurantName}`,
      html,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Send menu error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
