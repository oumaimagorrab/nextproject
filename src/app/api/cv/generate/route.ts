import { NextRequest, NextResponse } from 'next/server';
import { jsPDF } from 'jspdf';

// Type definitions for better type safety
interface PersonalInfo {
  fullName: string;
  email: string;
  phone?: string;
  address?: string;
}

interface Experience {
  id: string;
  jobTitle: string;
  company: string;
  startDate: string;
  endDate: string;
  description: string;
}

interface Education {
  id: string;
  degree: string;
  institution: string;
  graduationYear: string;
}

interface CVData {
  personalInfo: PersonalInfo;
  summary: string;
  experience: Experience[];
  education: Education[];
  skills: string;
}

export async function POST(req: NextRequest) {
  try {
    const cv: CVData = await req.json();
    
    // Validate required fields
    if (!cv.personalInfo?.fullName || !cv.personalInfo?.email) {
      return NextResponse.json(
        { error: 'Full name and email are required' },
        { status: 400 }
      );
    }

    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageWidth = 210;
    const margin = 24;
    let y = 24;
    const contentWidth = pageWidth - (margin * 2);

    // Color palette
    const colors = {
      primary: '#1a365d',       // Deep navy
      secondary: '#2d3748',     // Dark gray
      accent: '#3182ce',        // Blue accent
      lightGray: '#718096',     // Medium gray
      lighterGray: '#a0aec0',   // Light gray
      sectionLine: '#e2e8f0',   // Subtle separator
    };

    // Helper to check page overflow
    const addPageIfNeeded = (requiredSpace: number = 12) => {
      if (y + requiredSpace > 280) {
        doc.addPage();
        y = 24;
        return true;
      }
      return false;
    };

    // Section title helper with consistent styling
    const addSectionTitle = (title: string, spaceBefore: number = 20) => {
      addPageIfNeeded(spaceBefore);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(colors.primary);
      doc.text(title, margin, y);
      y += 8;
      doc.setDrawColor(colors.sectionLine);
      doc.setLineWidth(0.5);
      doc.line(margin, y, pageWidth - margin, y);
      y += 12;
    };

    // Format contact info
    const formatContact = (info: PersonalInfo): string => {
      return [
        info.email,
        info.phone,
        info.address
      ].filter(Boolean).join(' • ') || '';
    };

    /* ========= HEADER SECTION ========= */
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.setTextColor(colors.primary);
    doc.text(cv.personalInfo.fullName, margin, y, { maxWidth: contentWidth });
    y += 12;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(colors.accent);
    const contact = formatContact(cv.personalInfo);
    doc.text(contact, margin, y, { maxWidth: contentWidth });
    
    // Add subtle bottom border to header
    y += 14;
    doc.setDrawColor(colors.sectionLine);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
    y += 18;

    /* ========= PROFESSIONAL SUMMARY ========= */
    if (cv.summary?.trim()) {
      addSectionTitle('PROFESSIONAL SUMMARY');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(colors.secondary);
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(cv.summary, contentWidth);
      doc.text(lines, margin, y);
      y += (lines.length * 5.5) + 15;
    }

    /* ========= WORK EXPERIENCE ========= */
    if (cv.experience?.length > 0) {
      addSectionTitle('WORK EXPERIENCE');
      
      cv.experience.forEach((exp, index) => {
        addPageIfNeeded(28);
        
        // Job title with accent color
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(colors.primary);
        doc.text(exp.jobTitle || 'Position', margin, y, { maxWidth: contentWidth });
        
        // Company and dates - styled as subheading
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(colors.accent);
        const details = `${exp.company || ''} • ${exp.startDate || ''} - ${exp.endDate || 'Present'}`;

        doc.text(details, margin, y + 6, { maxWidth: contentWidth });
        
        y += 14;
        
        // Description with better spacing
        if (exp.description?.trim()) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(10.5);
          doc.setTextColor(colors.secondary);
          doc.setFont('helvetica', 'normal');
          const descLines = doc.splitTextToSize(exp.description, contentWidth - 4);
          doc.text(descLines, margin + 2, y);
          y += (descLines.length * 5) + 12;
        }
        
        // Add subtle separator between experiences (except last one)
        if (index < cv.experience.length - 1) {
          doc.setDrawColor(colors.sectionLine);
          doc.setLineWidth(0.2);
          doc.line(margin, y, margin + 40, y);
          y += 8;
        }
      });
    }

    /* ========= EDUCATION ========= */
    if (cv.education?.length > 0) {
      addSectionTitle('EDUCATION');
      
      cv.education.forEach((edu, index) => {
        addPageIfNeeded(18);
        
        // Degree
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(colors.primary);
        doc.text(edu.degree || 'Degree', margin, y, { maxWidth: contentWidth });
        
        // Institution and year
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10.5);
        doc.setTextColor(colors.lightGray);
        const eduDetails = `${edu.institution || ''}${edu.graduationYear ? ` • Graduated ${edu.graduationYear}` : ''}`;
        doc.text(eduDetails, margin, y + 5, { maxWidth: contentWidth });
        
        y += 14;
        
        // Add spacing between education entries (except last one)
        if (index < cv.education.length - 1) {
          doc.setDrawColor(colors.sectionLine);
          doc.setLineWidth(0.2);
          doc.line(margin, y, margin + 30, y);
          y += 6;
        }
      });
    }

    /* ========= SKILLS ========= */
    if (cv.skills?.trim()) {
      addSectionTitle('SKILLS');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(colors.secondary);
      
      // Process skills and wrap text properly
      const skillsList = cv.skills
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);
      
      if (skillsList.length > 0) {
        // Format as badges with subtle styling
        const skillsText = skillsList.map(skill => `${skill}`).join(' • ');
        doc.setFont('helvetica', 'normal');
        const lines = doc.splitTextToSize(skillsText, contentWidth);
        doc.text(lines, margin, y);
        y += (lines.length * 5.5) + 10;
      }
    }

    // Add page numbers if multiple pages
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setTextColor(colors.lighterGray);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Page ${i} of ${pageCount}`,
        pageWidth - margin - 15,
        290,
        { align: 'right' }
        );
    }

    const pdfBuffer = doc.output('arraybuffer');
    
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${cv.personalInfo.fullName.replace(/\s+/g, '_')}_CV.pdf"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    });
    
  } catch (error) {
    console.error('PDF Generation Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate PDF',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}