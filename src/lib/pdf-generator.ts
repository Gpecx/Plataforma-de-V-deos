import { chromium } from 'playwright'

export async function generatePDF(url: string, cookies?: { name: string, value: string, domain: string }[]): Promise<Uint8Array> {
  const browser = await chromium.launch({
    headless: true,
  })
  
  try {
    const context = await browser.newContext({
      viewport: { width: 1123, height: 794 },
      deviceScaleFactor: 2,
    })

    if (cookies && cookies.length > 0) {
      await context.addCookies(cookies)
    }
    
    const page = await context.newPage()
    
    await page.goto(url, { waitUntil: 'networkidle' })
    await page.evaluateHandle('document.fonts.ready')

    const pdfBuffer = await page.pdf({
      format: 'A4',
      landscape: true,
      printBackground: true,
      margin: {
        top: '0px',
        right: '0px',
        bottom: '0px',
        left: '0px',
      },
      scale: 1,
    })

    const result = new Uint8Array(pdfBuffer.length)
    result.set(pdfBuffer)
    return result
  } finally {
    await browser.close()
  }
}