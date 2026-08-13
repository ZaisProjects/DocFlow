import PDFDocument from 'pdfkit';
import { Document as DocxDocument, Packer, Paragraph, TextRun } from 'docx';
import { JSDOM } from 'jsdom';
import { convert } from 'html-to-text';

import DocumentModel from '../models/Document.js';

// Helper: extract plain text from HTML
function htmlToPlainText(html) {
  const dom = new JSDOM(html || '');
  return dom.window.document.body.textContent || '';
}

// GET /api/documents/:id/export/pdf
export const exportPdf = async (req, res) => {
  try {
    const document = await DocumentModel.findById(req.params.id);

    if (!document || document.isDeleted) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const text = htmlToPlainText(document.content);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${document.title}.pdf"`
    );

    const pdf = new PDFDocument({ margin: 50 });

    pdf.pipe(res);

    pdf.fontSize(22).text(document.title, { underline: true });
    pdf.moveDown();

    pdf.fontSize(12).text(text, {
      align: 'left',
      lineGap: 4,
    });

    pdf.end();
  } catch (error) {
    res.status(500).json({
      message: 'Failed to export PDF',
      error: error.message,
    });
  }
};

// GET /api/documents/:id/export/docx
export const exportDocx = async (req, res) => {
  try {
    const document = await DocumentModel.findById(req.params.id);

    if (!document || document.isDeleted) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const text = htmlToPlainText(document.content);

    const doc = new DocxDocument({
      sections: [
        {
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: document.title,
                  bold: true,
                  size: 36,
                }),
              ],
            }),
            new Paragraph(''),
            new Paragraph(text),
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${document.title}.docx"`
    );

    res.send(buffer);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to export DOCX',
      error: error.message,
    });
  }
};

// GET /api/documents/:id/export/txt
export const exportTxt = async (req, res) => {
  try {
    const document = await DocumentModel.findById(req.params.id);

    if (!document || document.isDeleted) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const text = convert(document.content || '', {
      wordwrap: false,
    });

    res.setHeader('Content-Type', 'text/plain');

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${document.title}.txt"`
    );

    res.send(text);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to export TXT',
      error: error.message,
    });
  }
};