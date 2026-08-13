import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { ServiceOrder } from '../../types'
import {
  formatCurrency,
  getServiceOrderStatusLabel,
} from '../serviceOrder'
import {
  PDF,
  drawDocumentHeader,
  drawFooter,
  drawPageBackground,
  drawSectionTitle,
  ensureSpace,
  fileSafe,
  formatDateBr,
  tableTheme,
} from './pdfTheme'

export interface OfficeReportPdfOptions {
  orders: ServiceOrder[]
  faturamento: number
  byStatus: Array<{ status: string; count: number }>
  byResponsible: Array<{ name: string; count: number; total: number }>
  dataInicio?: string
  dataFim?: string
  statusLabel?: string
  responsibleLabel?: string
}

export function downloadOfficeReportPdf(options: OfficeReportPdfOptions) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  drawPageBackground(doc)

  let y = drawDocumentHeader(doc, {
    title: 'Relatório da oficina',
    subtitle: 'Faturamento, status e responsáveis',
    metaRight: new Date().toLocaleDateString('pt-BR'),
  })

  y = ensureSpace(doc, y, 20)
  y = drawSectionTitle(doc, 'Filtros', y)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...PDF.colors.text)
  const filters = [
    `Período: ${formatDateBr(options.dataInicio)} — ${formatDateBr(options.dataFim)}`,
    `Status: ${options.statusLabel ?? 'Todos'}`,
    `Responsável: ${options.responsibleLabel ?? 'Todos'}`,
    `OS no filtro: ${options.orders.length}`,
    `Faturamento (concluídas): ${formatCurrency(options.faturamento)}`,
  ]
  for (const line of filters) {
    doc.text(line, PDF.margin, y)
    y += 5
  }

  y = ensureSpace(doc, y, 40)
  y = drawSectionTitle(doc, 'Por status', y)
  autoTable(doc, {
    startY: y,
    head: [['Status', 'Quantidade']],
    body: options.byStatus.map((row) => [row.status, String(row.count)]),
    ...tableTheme,
  })
  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8

  y = ensureSpace(doc, y, 40)
  y = drawSectionTitle(doc, 'Por responsável', y)
  autoTable(doc, {
    startY: y,
    head: [['Responsável', 'OS', 'Total']],
    body: options.byResponsible.map((row) => [
      row.name,
      String(row.count),
      formatCurrency(row.total),
    ]),
    ...tableTheme,
  })
  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8

  y = ensureSpace(doc, y, 40)
  y = drawSectionTitle(doc, 'Ordens no período', y)
  autoTable(doc, {
    startY: y,
    head: [['OS', 'Data', 'Cliente', 'Status', 'Responsável', 'Total']],
    body: options.orders.map((order) => [
      `#${order.id}`,
      formatDateBr(order.data),
      order.clienteNome,
      getServiceOrderStatusLabel(order.status),
      order.tecnicoNome,
      formatCurrency(order.precoTotal),
    ]),
    ...tableTheme,
  })

  drawFooter(doc, 'Relatório gerado pelo Vortex Mec')
  doc.save(`relatorio-oficina-${fileSafe(new Date().toISOString().slice(0, 10))}.pdf`)
}
