// app/api/cv/send/route.ts
import nodemailer from 'nodemailer';
import { NextRequest, NextResponse } from 'next/server';
import jsPDF from 'jspdf';

export async function POST(req: NextRequest) {
  try {
    const { email, cvData } = await req.json();

    if (!email || !cvData) {
      return NextResponse.json({ error: 'Missing email or CV data' }, { status: 400 });
    }

    // 1️⃣ Générer le PDF avec jsPDF
    const doc = new jsPDF();

    doc.setFontSize(22);
    doc.text(cvData.personalInfo.fullName || 'No Name', 20, 20);

    doc.setFontSize(16);
    doc.text('Summary:', 20, 40);
    doc.setFontSize(12);
    doc.text(cvData.summary || '', 20, 50, { maxWidth: 170 });

    // Ajouter expériences
    let y = 70;
    cvData.experience.forEach((exp: any, i: number) => {
      doc.setFontSize(14);
      doc.text(`${i + 1}. ${exp.jobTitle} at ${exp.company}`, 20, y);
      y += 6;
      doc.setFontSize(12);
      doc.text(`${exp.startDate} - ${exp.endDate}`, 20, y);
      y += 6;
      doc.text(exp.description || '', 25, y);
      y += 12;
    });

    // Ajouter education
    cvData.education.forEach((edu: any, i: number) => {
      doc.setFontSize(14);
      doc.text(`${i + 1}. ${edu.degree} - ${edu.institution} (${edu.graduationYear})`, 20, y);
      y += 10;
    });

    // Ajouter skills
    doc.setFontSize(14);
    doc.text('Skills:', 20, y);
    y += 6;
    doc.setFontSize(12);
    doc.text(cvData.skills || '', 20, y);

    const pdfBuffer = doc.output('arraybuffer');

    // 2️⃣ Configurer Nodemailer
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // 3️⃣ Envoyer l’email avec PDF en pièce jointe
    await transporter.sendMail({
      from: `"CV Builder" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `Your CV - ${cvData.personalInfo.fullName}`,
      text: 'Attached is your CV generated from CV Builder.',
      attachments: [
        {
          filename: `${cvData.personalInfo.fullName.replace(/\s+/g, '_')}_CV.pdf`,
          content: Buffer.from(pdfBuffer),
          contentType: 'application/pdf',
        },
      ],
    });

    return NextResponse.json({ message: 'CV sent successfully!' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to send CV' }, { status: 500 });
  }
}
