import { jsPDF } from 'jspdf'

export const PDF = {
  margin: 16,
  colors: {
    primary: [17, 24, 39] as [number, number, number],
    accent: [30, 64, 175] as [number, number, number],
    surface: [249, 250, 251] as [number, number, number],
    border: [209, 213, 219] as [number, number, number],
    line: [229, 231, 235] as [number, number, number],
    text: [17, 24, 39] as [number, number, number],
    muted: [107, 114, 128] as [number, number, number],
    white: [255, 255, 255] as [number, number, number],
  },
}

export function fileSafe(value: string) {
  return value.replace(/[^\w.-]+/g, '_').replace(/_+/g, '_')
}

export function formatDateBr(value?: string) {
  if (!value) return '—'
  const [year, month, day] = value.split('-')
  if (!year || !month || !day) return value
  return `${day}/${month}/${year}`
}

export function getPageSize(doc: jsPDF) {
  return {
    width: doc.internal.pageSize.getWidth(),
    height: doc.internal.pageSize.getHeight(),
  }
}

export function drawPageBackground(doc: jsPDF) {
  const { width, height } = getPageSize(doc)
  doc.setFillColor(...PDF.colors.white)
  doc.rect(0, 0, width, height, 'F')
}

/** Cabeçalho institucional full-bleed */
export function drawDocumentHeader(
  doc: jsPDF,
  options: {
    title: string
    subtitle: string
    metaRight?: string
  },
) {
  const { width } = getPageSize(doc)
  const { colors } = PDF

  doc.setFillColor(...colors.primary)
  doc.rect(0, 0, width, 32, 'F')

  doc.setFillColor(...colors.accent)
  doc.rect(0, 32, width, 1.2, 'F')

  doc.setTextColor(...colors.white)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text('VORTEX MEC', 16, 10)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(156, 163, 175)
  doc.text('Oficina mecânica', 16, 14.5)

  doc.setTextColor(...colors.white)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text(options.title, 16, 23)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(209, 213, 219)
  doc.text(options.subtitle, 16, 28.5)

  if (options.metaRight) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(...colors.white)
    doc.text(options.metaRight, width - 16, 18, { align: 'right' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(156, 163, 175)
    doc.text('Nº do documento', width - 16, 12, { align: 'right' })
  }

  return 42
}

export function drawSectionTitle(doc: jsPDF, title: string, y: number) {
  const { margin, colors } = PDF
  const { width } = getPageSize(doc)

  doc.setTextColor(...colors.primary)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text(title.toUpperCase(), margin, y)

  doc.setDrawColor(...colors.accent)
  doc.setLineWidth(0.6)
  doc.line(margin, y + 2, margin + 18, y + 2)

  doc.setDrawColor(...colors.line)
  doc.setLineWidth(0.2)
  doc.line(margin + 20, y + 2, width - margin, y + 2)

  return y + 8
}

/** Grade de campos estilo ficha (label à esquerda, valor à direita) */
export function drawFieldGrid(
  doc: jsPDF,
  y: number,
  fields: Array<[string, string]>,
  columns = 2,
) {
  const { margin, colors } = PDF
  const { width } = getPageSize(doc)
  const gap = 4
  const colWidth = (width - margin * 2 - gap * (columns - 1)) / columns
  const rowHeight = 11
  const rows = Math.ceil(fields.length / columns)

  doc.setFillColor(...colors.surface)
  doc.setDrawColor(...colors.border)
  doc.setLineWidth(0.25)
  doc.rect(margin, y, width - margin * 2, rows * rowHeight, 'FD')

  fields.forEach(([label, value], index) => {
    const col = index % columns
    const row = Math.floor(index / columns)
    const x = margin + col * (colWidth + gap)
    const rowY = y + row * rowHeight

    if (col > 0) {
      doc.setDrawColor(...colors.line)
      doc.setLineWidth(0.2)
      doc.line(x - gap / 2, rowY + 1.5, x - gap / 2, rowY + rowHeight - 1.5)
    }
    if (row > 0) {
      doc.setDrawColor(...colors.line)
      doc.line(margin + 1, rowY, width - margin - 1, rowY)
    }

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    doc.setTextColor(...colors.muted)
    doc.text(label.toUpperCase(), x + 3, rowY + 3.8)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...colors.text)
    const valueLines = doc.splitTextToSize(value || '—', colWidth - 6)
    doc.text(valueLines[0] ?? '—', x + 3, rowY + 8.2)
  })

  return rows * rowHeight
}

export function drawNoteBlock(doc: jsPDF, y: number, title: string, text: string) {
  const { margin, colors } = PDF
  const { width } = getPageSize(doc)
  const lines = doc.splitTextToSize(text, width - margin * 2 - 8)
  const height = 9 + lines.length * 4.2

  doc.setFillColor(...colors.surface)
  doc.setDrawColor(...colors.border)
  doc.setLineWidth(0.25)
  doc.rect(margin, y, width - margin * 2, height, 'FD')

  doc.setFillColor(...colors.accent)
  doc.rect(margin, y, 1.2, height, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(...colors.muted)
  doc.text(title.toUpperCase(), margin + 5, y + 4.5)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...colors.text)
  doc.text(lines, margin + 5, y + 9)

  return height
}

export function drawTotalsPanel(
  doc: jsPDF,
  y: number,
  rows: Array<[string, string]>,
  totalLabel: string,
  totalValue: string,
) {
  const { margin, colors } = PDF
  const { width } = getPageSize(doc)
  const panelWidth = 78
  const x = width - margin - panelWidth
  const bodyHeight = rows.length * 6 + 4
  const totalHeight = 12

  doc.setDrawColor(...colors.border)
  doc.setLineWidth(0.25)
  doc.setFillColor(...colors.white)
  doc.rect(x, y, panelWidth, bodyHeight + totalHeight, 'FD')

  let rowY = y + 5
  for (const [label, value] of rows) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...colors.muted)
    doc.text(label, x + 3, rowY)
    doc.setTextColor(...colors.text)
    doc.text(value, x + panelWidth - 3, rowY, { align: 'right' })
    rowY += 6
  }

  doc.setFillColor(...colors.primary)
  doc.rect(x, y + bodyHeight, panelWidth, totalHeight, 'F')
  doc.setTextColor(...colors.white)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text(totalLabel, x + 3, y + bodyHeight + 7.5)
  doc.setFontSize(11)
  doc.text(totalValue, x + panelWidth - 3, y + bodyHeight + 7.8, { align: 'right' })

  return bodyHeight + totalHeight
}

export function drawSignatureBlock(doc: jsPDF, y: number) {
  const { margin, colors } = PDF
  const { width } = getPageSize(doc)
  const boxHeight = 48

  doc.setDrawColor(...colors.border)
  doc.setLineWidth(0.35)
  doc.setFillColor(...colors.white)
  doc.rect(margin, y, width - margin * 2, boxHeight, 'FD')

  doc.setFillColor(...colors.surface)
  doc.rect(margin, y, width - margin * 2, 7, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...colors.primary)
  doc.text('APROVAÇÃO DO CLIENTE', margin + 4, y + 4.8)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(...colors.text)
  const text = doc.splitTextToSize(
    'Declaro que revisei este orçamento e autorizo a execução dos serviços descritos, ciente dos valores apresentados.',
    width - margin * 2 - 8,
  )
  doc.text(text, margin + 4, y + 12)

  const lineY = y + 28
  const colW = (width - margin * 2 - 12) / 2

  doc.setDrawColor(...colors.primary)
  doc.setLineWidth(0.35)
  doc.line(margin + 4, lineY, margin + 4 + colW - 8, lineY)
  doc.line(margin + 8 + colW, lineY, width - margin - 4, lineY)

  doc.setFontSize(6.5)
  doc.setTextColor(...colors.muted)
  doc.text('Assinatura do cliente', margin + 4, lineY + 4)
  doc.text('Nome completo', margin + 8 + colW, lineY + 4)

  const lineY2 = y + 40
  doc.setDrawColor(...colors.primary)
  doc.line(margin + 4, lineY2, margin + 4 + colW - 8, lineY2)
  doc.line(margin + 8 + colW, lineY2, width - margin - 4, lineY2)
  doc.text('CPF / Documento', margin + 4, lineY2 + 4)
  doc.text('Data ____ / ____ / ________', margin + 8 + colW, lineY2 + 4)

  return boxHeight
}

export function drawFooter(doc: jsPDF, note: string) {
  const { margin, colors } = PDF
  const { width, height } = getPageSize(doc)
  const pageCount = doc.getNumberOfPages()

  for (let i = 1; i <= pageCount; i += 1) {
    doc.setPage(i)
    doc.setDrawColor(...colors.border)
    doc.setLineWidth(0.3)
    doc.line(margin, height - 12, width - margin, height - 12)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...colors.muted)
    doc.text(note, margin, height - 7)
    doc.text(`Página ${i} de ${pageCount}`, width - margin, height - 7, { align: 'right' })
  }
}

export function ensureSpace(doc: jsPDF, y: number, needed: number, top = 20) {
  const { height } = getPageSize(doc)
  if (y + needed <= height - 18) return y
  doc.addPage()
  drawPageBackground(doc)
  return top
}

export const tableTheme = {
  styles: {
    font: 'helvetica',
    fontSize: 8,
    cellPadding: { top: 2.8, right: 2.5, bottom: 2.8, left: 2.5 },
    textColor: PDF.colors.text,
    lineColor: PDF.colors.border,
    lineWidth: 0.2,
  },
  headStyles: {
    fillColor: PDF.colors.primary,
    textColor: PDF.colors.white,
    fontStyle: 'bold' as const,
    fontSize: 7.5,
    cellPadding: { top: 3.2, right: 2.5, bottom: 3.2, left: 2.5 },
  },
  alternateRowStyles: {
    fillColor: PDF.colors.surface,
  },
  margin: { left: PDF.margin, right: PDF.margin },
}
