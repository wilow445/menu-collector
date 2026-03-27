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
        const price = item.price ? `<span style="color:#C4652E;font-weight:700;">${item.price} &euro;</span>` : ''
        const desc = item.description?.fr?.trim()
          ? `<div style="color:#7A7368;font-size:13px;margin-top:2px;">${item.description.fr}</div>`
          : ''
        itemsHtml += `
          <div style="padding:10px 0;border-bottom:1px solid #E8E4DD;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="font-weight:600;">${item.name.fr}</span>
              ${price}
            </div>
            ${desc}
          </div>`
      }

      categoriesHtml += `
        <div style="margin-bottom:24px;">
          <div style="background:#F3F0EB;padding:8px 14px;border-radius:8px;margin-bottom:4px;">
            <strong style="color:#C4652E;text-transform:uppercase;font-size:14px;">${cat.name}</strong>
          </div>
          ${itemsHtml}
        </div>`
    }

    const notesHtml = notes?.trim()
      ? `<div style="margin-top:20px;padding:14px;background:#FFF8F0;border-radius:8px;border-left:4px solid #C4652E;">
           <strong>Remarque :</strong><br>${notes}
         </div>`
      : ''

    const html = `
      <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;color:#1B1B1B;">
        <div style="background:#1B1B1B;padding:24px 30px;border-radius:12px 12px 0 0;">
          <h1 style="color:#fff;margin:0;font-size:22px;">${restaurantName}</h1>
          <p style="color:#999;margin:6px 0 0;font-size:13px;">${dateStr} &middot; Langues : ${languages.join(', ').toUpperCase()}</p>
        </div>
        <div style="padding:24px 30px;background:#FFFFFF;border:1px solid #E8E4DD;border-top:none;border-radius:0 0 12px 12px;">
          <p style="color:#7A7368;font-size:14px;margin-bottom:20px;">
            ${categories.filter(c => c.items.length > 0).length} cat&eacute;gories &middot; ${totalProducts} produits
          </p>
          ${categoriesHtml}
          ${notesHtml}
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
