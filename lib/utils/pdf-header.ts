export interface PdfHeaderData {
  title: string;
  orgName: string;
  generatedAt: string;
  logoUrl?: string;
  periodName?: string;
}

/**
 * Standardizes metadata and structural headers for PDF generation pipelines.
 */
export function buildPdfHeader(data: PdfHeaderData) {
  if (!data.title || !data.orgName) {
    throw new Error('Title and Organization Name are required to build PDF header.');
  }

  return {
    documentTitle: data.title.toUpperCase(),
    meta: {
      organisation: data.orgName,
      printedAt: data.generatedAt,
      reportingPeriod: data.periodName || 'N/A',
      logo: data.logoUrl || null,
    },
    styles: {
      headerBg: '#1E293B',
      textColor: '#FFFFFF',
      titleFontSize: 18,
      subTitleFontSize: 10,
    }
  };
}
