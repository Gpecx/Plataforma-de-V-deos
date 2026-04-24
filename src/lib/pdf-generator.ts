import { chromium } from 'playwright'

export async function generatePDF(url: string): Promise<Buffer> {
  const browser = await chromium.launch({
    headless: true,
  })
  
  try {
    const context = await browser.newContext({
      viewport: { width: 1123, height: 794 }, // A4 landscape at 96dpi approx
      deviceScaleFactor: 2, // Better resolution
    })
    
    const page = await context.newPage()
    
    // Set extra headers or cookies if needed
    // Navigation
    await page.goto(url, { waitUntil: 'networkidle' })
    
    // Wait for fonts to load
    await page.evaluateHandle('document.fonts.ready')

    // Generate PDF
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

    return Buffer.from(pdfBuffer)
  } finally {
    await browser.close()
  }
}
