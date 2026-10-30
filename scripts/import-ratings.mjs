import ExcelJS from 'exceljs'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const source = resolve('Energy Drink rating list .xlsx')
const destination = resolve('app/data/drinks.json')
const workbook = new ExcelJS.Workbook()
await workbook.xlsx.readFile(source)

const drinks = []
for (const sheet of workbook.worksheets) {
  if (sheet.name.toLowerCase() === 'dashboard') continue
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return
    const brandCell = row.getCell(1).value
    const flavorCell = row.getCell(2).value
    const ratingCell = row.getCell(3).value
    const buyAgainCell = row.getCell(4).value
    const brand = typeof brandCell === 'string' ? brandCell.replace(/\s+/g, ' ').trim() : ''
    const flavor = typeof flavorCell === 'string' ? flavorCell.trim() : ''
    const rating = typeof ratingCell === 'number' ? ratingCell : Number(ratingCell)
    if (!brand || !flavor || !Number.isFinite(rating)) return
    const verdict = String(buyAgainCell ?? '').trim().toLowerCase()
    const buyAgain = verdict === 'yes' ? 'yes' : verdict === 'no' ? 'no' : 'unknown'
    const id = `${sheet.name}-${rowNumber}-${flavor}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    drinks.push({ id, brand: sheet.name === 'MISC' ? brand : sheet.name, flavor, rating, buyAgain })
  })
}

await mkdir(resolve('app/data'), { recursive: true })
await writeFile(destination, `${JSON.stringify(drinks, null, 2)}\n`)
console.log(`Imported ${drinks.length} drinks across ${new Set(drinks.map((drink) => drink.brand)).size} brands into ${destination}`)
