import PDFDocument from 'pdfkit';

interface ReportMeta {
  title: string;
  organizationName: string;
  generatedAt: string;
  filters?: Record<string, string | undefined>;
}

function addMeta(doc: typeof PDFDocument.prototype, meta: ReportMeta): void {
  doc.fontSize(20).font('Helvetica-Bold').text(meta.title, { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(10).font('Helvetica').fillColor('#666');
  doc.text(`Organization: ${meta.organizationName}`, { align: 'center' });
  doc.text(`Generated: ${meta.generatedAt}`, { align: 'center' });
  if (meta.filters) {
    const parts: string[] = [];
    if (meta.filters.startDate) parts.push(`From: ${meta.filters.startDate}`);
    if (meta.filters.endDate) parts.push(`To: ${meta.filters.endDate}`);
    if (meta.filters.severity) parts.push(`Severity: ${meta.filters.severity}`);
    if (meta.filters.status) parts.push(`Status: ${meta.filters.status}`);
    if (meta.filters.assetType) parts.push(`Asset Type: ${meta.filters.assetType}`);
    if (parts.length > 0) doc.text(`Filters: ${parts.join(' | ')}`, { align: 'center' });
  }
  doc.fillColor('#000');
  doc.moveDown(1);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#ddd').stroke();
  doc.moveDown(1);
}

function addSection(doc: typeof PDFDocument.prototype, title: string): void {
  doc.fontSize(14).font('Helvetica-Bold').fillColor('#1a1a2e').text(title);
  doc.moveDown(0.5);
  doc.fillColor('#000');
}

function addTableHeader(doc: typeof PDFDocument.prototype, headers: string[], widths: number[], startY: number): number {
  let x = 50;
  const rowHeight = 20;

  doc.fontSize(9).font('Helvetica-Bold').fillColor('#fff');
  doc.roundedRect(50, startY, 495, rowHeight, 3).fill('#1a1a2e');
  doc.fillColor('#fff');

  for (let i = 0; i < headers.length; i++) {
    doc.text(headers[i], x + 4, startY + 5, { width: widths[i] - 8, align: 'left' });
    x += widths[i];
  }

  doc.fillColor('#000');
  return startY + rowHeight;
}

function addTableRow(
  doc: typeof PDFDocument.prototype,
  cells: string[],
  widths: number[],
  startY: number,
  isEven: boolean,
): number {
  let x = 50;
  const rowHeight = 18;

  if (isEven) {
    doc.rect(50, startY, 495, rowHeight).fill('#f8f9fa');
  }
  doc.rect(50, startY, 495, rowHeight).stroke('#e9ecef');
  doc.fontSize(8).font('Helvetica').fillColor('#333');

  for (let i = 0; i < cells.length; i++) {
    doc.text(cells[i], x + 4, startY + 5, { width: widths[i] - 8, align: 'left' });
    x += widths[i];
  }

  doc.fillColor('#000');
  return startY + rowHeight;
}

function addStatBox(doc: typeof PDFDocument.prototype, label: string, value: string | number, x: number, y: number): void {
  doc.roundedRect(x, y, 110, 45, 4).stroke('#e9ecef');
  doc.fontSize(18).font('Helvetica-Bold').fillColor('#1a1a2e').text(String(value), x + 8, y + 6, { width: 94, align: 'center' });
  doc.fontSize(8).font('Helvetica').fillColor('#666').text(label, x + 8, y + 30, { width: 94, align: 'center' });
  doc.fillColor('#000');
}

export function generateIncidentPDF(
  report: {
    data: { title: string; severity: string; status: string; createdAt: string; assignedUser?: { firstName: string; lastName: string } | null }[];
    total: number;
    severityBreakdown: { critical: number; high: number; medium: number; low: number };
    statusBreakdown: { open: number; inProgress: number; resolved: number; closed: number };
  },
  meta: ReportMeta,
): Buffer {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  const buffers: Buffer[] = [];
  doc.on('data', (chunk: Buffer) => buffers.push(chunk));

  addMeta(doc, meta);

  addSection(doc, 'Statistics');
  let sy = doc.y;
  addStatBox(doc, 'Total', report.total, 50, sy);
  addStatBox(doc, 'Critical', report.severityBreakdown.critical, 170, sy);
  addStatBox(doc, 'High', report.severityBreakdown.high, 290, sy);
  addStatBox(doc, 'Medium', report.severityBreakdown.medium, 410, sy);

  sy += 60;
  addStatBox(doc, 'Open', report.statusBreakdown.open, 50, sy);
  addStatBox(doc, 'In Progress', report.statusBreakdown.inProgress, 170, sy);
  addStatBox(doc, 'Resolved', report.statusBreakdown.resolved, 290, sy);
  addStatBox(doc, 'Closed', report.statusBreakdown.closed, 410, sy);

  doc.y = sy + 60;
  doc.moveDown(1);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#ddd').stroke();
  doc.moveDown(1);

  addSection(doc, 'Incidents');

  const widths = [180, 70, 80, 80, 85];
  const headers = ['Title', 'Severity', 'Status', 'Assigned To', 'Created'];
  let rowY = addTableHeader(doc, headers, widths, doc.y);

  for (let i = 0; i < report.data.length; i++) {
    const inc = report.data[i];
    const assigned = inc.assignedUser ? `${inc.assignedUser.firstName} ${inc.assignedUser.lastName}` : '-';
    const created = inc.createdAt ? new Date(inc.createdAt).toLocaleDateString() : '-';
    const status = inc.status === 'IN_PROGRESS' ? 'In Progress' : inc.status.charAt(0) + inc.status.slice(1).toLowerCase();

    rowY = addTableRow(doc, [inc.title, inc.severity, status, assigned, created], widths, rowY, i % 2 === 0);

    if (rowY > 750) {
      doc.addPage();
      rowY = 50;
      rowY = addTableHeader(doc, headers, widths, rowY);
    }
  }

  doc.end();
  return Buffer.concat(buffers);
}

export function generateAssetPDF(
  report: {
    data: { assetName: string; assetType: string; criticality: string; status: string; ipAddress?: string | null }[];
    total: number;
    typeBreakdown: Record<string, number>;
    criticalityBreakdown: { critical: number; high: number; medium: number; low: number };
  },
  meta: ReportMeta,
): Buffer {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  const buffers: Buffer[] = [];
  doc.on('data', (chunk: Buffer) => buffers.push(chunk));

  addMeta(doc, meta);

  addSection(doc, 'Statistics');
  let sy = doc.y;
  addStatBox(doc, 'Total Assets', report.total, 50, sy);
  addStatBox(doc, 'Critical', report.criticalityBreakdown.critical, 170, sy);
  addStatBox(doc, 'High', report.criticalityBreakdown.high, 290, sy);
  addStatBox(doc, 'Medium', report.criticalityBreakdown.medium, 410, sy);
  sy += 60;
  addStatBox(doc, 'Low', report.criticalityBreakdown.low, 50, sy);

  doc.y = sy + 60;
  doc.moveDown(1);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#ddd').stroke();
  doc.moveDown(1);

  addSection(doc, 'Assets');

  const widths = [140, 90, 80, 80, 105];
  const headers = ['Asset Name', 'Type', 'Criticality', 'Status', 'IP Address'];
  let rowY = addTableHeader(doc, headers, widths, doc.y);

  for (let i = 0; i < report.data.length; i++) {
    const a = report.data[i];
    const type = a.assetType.replace(/_/g, ' ');
    const ip = a.ipAddress || '-';

    rowY = addTableRow(doc, [a.assetName, type, a.criticality, a.status, ip], widths, rowY, i % 2 === 0);

    if (rowY > 750) {
      doc.addPage();
      rowY = 50;
      rowY = addTableHeader(doc, headers, widths, rowY);
    }
  }

  doc.end();
  return Buffer.concat(buffers);
}

export function generateExecutiveSummaryPDF(
  report: {
    totalIncidents: number;
    openIncidents: number;
    criticalIncidents: number;
    totalAssets: number;
    activeAssets: number;
    criticalAssets: number;
    recentIncidents: { title: string; severity: string; status: string; createdAt: string; createdBy: { firstName: string; lastName: string } }[];
  },
  meta: ReportMeta,
): Buffer {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  const buffers: Buffer[] = [];
  doc.on('data', (chunk: Buffer) => buffers.push(chunk));

  addMeta(doc, meta);

  addSection(doc, 'Key Metrics');
  let sy = doc.y;
  addStatBox(doc, 'Total Incidents', report.totalIncidents, 50, sy);
  addStatBox(doc, 'Open Incidents', report.openIncidents, 170, sy);
  addStatBox(doc, 'Critical Incidents', report.criticalIncidents, 290, sy);
  addStatBox(doc, 'Total Assets', report.totalAssets, 410, sy);
  sy += 60;
  addStatBox(doc, 'Active Assets', report.activeAssets, 50, sy);
  addStatBox(doc, 'Critical Assets', report.criticalAssets, 170, sy);

  doc.y = sy + 60;
  doc.moveDown(1);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#ddd').stroke();
  doc.moveDown(1);

  if (report.recentIncidents.length > 0) {
    addSection(doc, 'Recent Incidents');

    const widths = [180, 70, 80, 80, 85];
    const headers = ['Title', 'Severity', 'Status', 'Created By', 'Created'];
    let rowY = addTableHeader(doc, headers, widths, doc.y);

    for (let i = 0; i < report.recentIncidents.length; i++) {
      const inc = report.recentIncidents[i];
      const creator = `${inc.createdBy.firstName} ${inc.createdBy.lastName}`;
      const created = inc.createdAt ? new Date(inc.createdAt).toLocaleDateString() : '-';
      const status = inc.status === 'IN_PROGRESS' ? 'In Progress' : inc.status.charAt(0) + inc.status.slice(1).toLowerCase();

      rowY = addTableRow(doc, [inc.title, inc.severity, status, creator, created], widths, rowY, i % 2 === 0);

      if (rowY > 750) {
        doc.addPage();
        rowY = 50;
        rowY = addTableHeader(doc, headers, widths, rowY);
      }
    }
  }

  doc.end();
  return Buffer.concat(buffers);
}
