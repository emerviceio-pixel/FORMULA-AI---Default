const Feedback = require('../models/Feedback');
const User = require('../models/User');
const PDFDocument = require('pdfkit');
const { decrypt } = require('../utils/encryption');

// Helper function to format date for filenames
const formatDate = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Helper function to format date for display
const formatDisplayDate = (date) => {
  const d = new Date(date);
  return d.toLocaleString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Generate PDF with Executive Summary only
const generatePDF = (exportData, startDate, endDate, feedbackType) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        margin: 50,
        size: 'A4',
        layout: 'portrait'
      });
      
      const chunks = [];
      
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      
      // Calculate statistics
      const total = exportData.length;
      const goodCount = exportData.filter(f => f.feedbackType === 'good').length;
      const badCount = exportData.filter(f => f.feedbackType === 'bad').length;
      const accuracyRate = total > 0 ? ((goodCount / total) * 100).toFixed(1) : 0;
      
      // Format dates properly
      const formatDisplayRange = (start, end) => {
        const startDateObj = new Date(start);
        const endDateObj = new Date(end);
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return `${startDateObj.toLocaleDateString('en-US', options)} - ${endDateObj.toLocaleDateString('en-US', options)}`;
      };
      
      // Header with gradient
      doc.rect(0, 0, doc.page.width, 140)
         .fill('#4f46e5');
      
      doc.fillColor('#ffffff')
         .fontSize(32)
         .font('Helvetica-Bold')
         .text('Feedback Analysis Report', 50, 45);
      
      doc.fontSize(12)
         .font('Helvetica')
         .text('Key Metrics Summary', 50, 95);
      
      doc.fontSize(10)
         .text(`Generated: ${new Date().toLocaleString()}`, 50, 115);
      
      // Date Range Box
      let currentY = 180;
      
      doc.fillColor('#ffffff')
         .rect(50, currentY, doc.page.width - 100, 60)
         .fill('#f8fafc')
         .stroke('#e2e8f0');
      
      doc.fillColor('#475569')
         .fontSize(10)
         .font('Helvetica-Bold')
         .text('REPORT PERIOD', 60, currentY + 12);
      
      const dateRangeText = formatDisplayRange(startDate, endDate);
      doc.fillColor('#1e293b')
         .fontSize(12)
         .font('Helvetica')
         .text(dateRangeText, 60, currentY + 32, {
           width: doc.page.width - 120,
           align: 'left'
         });
      
      currentY += 100;
      
      // Key Metrics Section
      doc.fillColor('#0f172a')
         .fontSize(18)
         .font('Helvetica-Bold')
         .text('Key Metrics', 50, currentY);
      
      currentY += 35;
      
      // Metrics Grid - 4 boxes
      const metrics = [
        { 
          label: 'Total Feedback', 
          value: total, 
          color: '#3b82f6',
          icon: '📊',
          bgColor: '#eff6ff'
        },
        { 
          label: 'Good Feedback', 
          value: goodCount, 
          color: '#10b981',
          icon: '✓',
          bgColor: '#f0fdf4'
        },
        { 
          label: 'Bad Feedback', 
          value: badCount, 
          color: '#ef4444',
          icon: '✗',
          bgColor: '#fef2f2'
        },
        { 
          label: 'AI Accuracy Rate', 
          value: `${accuracyRate}%`, 
          color: '#8b5cf6',
          icon: '🎯',
          bgColor: '#f5f3ff'
        }
      ];
      
      const boxWidth = (doc.page.width - 100) / 4;
      
      metrics.forEach((metric, index) => {
        const x = 50 + (index * boxWidth);
        
        // Background box
        doc.fillColor(metric.bgColor)
           .rect(x, currentY, boxWidth - 12, 90)
           .fill()
           .stroke('#e2e8f0');
        
        // Icon and label
        doc.fillColor('#475569')
           .fontSize(10)
           .font('Helvetica-Bold')
           .text(metric.icon, x + 12, currentY + 12);
        
        doc.fillColor('#64748b')
           .fontSize(9)
           .font('Helvetica')
           .text(metric.label, x + 12, currentY + 32);
        
        // Value
        doc.fillColor(metric.color)
           .fontSize(24)
           .font('Helvetica-Bold')
           .text(metric.value.toString(), x + 12, currentY + 52);
      });
      
      currentY += 110;
      
      // Feedback Type Breakdown (Pie chart alternative)
      if (total > 0) {
        doc.fillColor('#0f172a')
           .fontSize(16)
           .font('Helvetica-Bold')
           .text('Feedback Distribution', 50, currentY);
        
        currentY += 30;
        
        // Good Feedback bar
        const goodPercentage = (goodCount / total) * 100;
        const badPercentage = (badCount / total) * 100;
        
        doc.fillColor('#10b981')
           .fontSize(10)
           .font('Helvetica-Bold')
           .text(`Good (${goodCount})`, 50, currentY);
        
        doc.fillColor('#e2e8f0')
           .rect(50, currentY + 8, 300, 12)
           .fill();
        
        doc.fillColor('#10b981')
           .rect(50, currentY + 8, (goodPercentage / 100) * 300, 12)
           .fill();
        
        doc.fillColor('#475569')
           .fontSize(9)
           .text(`${goodPercentage.toFixed(1)}%`, 360, currentY + 10);
        
        currentY += 30;
        
        // Bad Feedback bar
        doc.fillColor('#ef4444')
           .fontSize(10)
           .font('Helvetica-Bold')
           .text(`Bad (${badCount})`, 50, currentY);
        
        doc.fillColor('#e2e8f0')
           .rect(50, currentY + 8, 300, 12)
           .fill();
        
        doc.fillColor('#ef4444')
           .rect(50, currentY + 8, (badPercentage / 100) * 300, 12)
           .fill();
        
        doc.fillColor('#475569')
           .fontSize(9)
           .text(`${badPercentage.toFixed(1)}%`, 360, currentY + 10);
      }
      
      // Footer - Fixed page numbering
      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        
        // Footer line
        doc.strokeColor('#e2e8f0')
           .lineWidth(0.5)
           .moveTo(50, doc.page.height - 40)
           .lineTo(doc.page.width - 50, doc.page.height - 40)
           .stroke();
        
        // Page number
        doc.fillColor('#94a3b8')
           .fontSize(9)
           .font('Helvetica')
           .text(
             `Page ${i + 1} of ${pageCount}`, 
             50, 
             doc.page.height - 30,
             { align: 'center', width: doc.page.width - 100 }
           );
        
        // Generation timestamp
        doc.fillColor('#cbd5e1')
           .fontSize(8)
           .text(
             `Generated by Admin Dashboard • ${new Date().toLocaleString()}`,
             50,
             doc.page.height - 20,
             { align: 'center', width: doc.page.width - 100 }
           );
      }
      
      doc.end();
      
    } catch (error) {
      reject(error);
    }
  });
};

// Export feedback data for AI analysis
const exportFeedback = async (req, res) => {
  try {
    const { startDate, endDate, feedbackType = 'all', format = 'csv' } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, error: 'Start date and end date are required' });
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Validate dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ success: false, error: 'Invalid date format' });
    }
    
    if (start > end) {
      return res.status(400).json({ success: false, error: 'Start date cannot be after end date' });
    }
    
    // Build query
    const query = {
      createdAt: {
        $gte: start,
        $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
      }
    };
    
    if (feedbackType !== 'all') {
      query.feedbackType = feedbackType;
    }
    
    // Fetch feedback with user details
    const feedbacks = await Feedback.find(query)
      .populate('userId', 'email country subscription')
      .sort({ createdAt: -1 });
    
    // Transform data for export
    const exportData = feedbacks.map(feedback => ({
      feedbackId: feedback._id.toString(),
      feedbackType: feedback.feedbackType,
      originalInput: feedback.originalInput,
      inputType: feedback.inputType || 'unknown',
      aiStatus: feedback.aiResponse?.status || 'unknown',
      aiReason: feedback.aiResponse?.reason || '',
      aiTips: Array.isArray(feedback.aiResponse?.tips) ? feedback.aiResponse.tips : [],
      userEmail: feedback.userId?.email || 'anonymous',
      userCountry: feedback.userCountry || feedback.userId?.country || 'unknown',
      userHealthConditions: Array.isArray(feedback.userHealthConditions) ? feedback.userHealthConditions : [],
      userAllergies: Array.isArray(feedback.userAllergies) ? feedback.userAllergies : [],
      userSubscription: feedback.userSubscription || 'free',
      createdAt: feedback.createdAt,
      // Additional fields useful for AI analysis
      isProblematic: feedback.feedbackType === 'bad' ? 1 : 0,
      dateOnly: formatDate(feedback.createdAt),
      month: feedback.createdAt.toLocaleString('default', { month: 'short' }),
      year: feedback.createdAt.getFullYear()
    }));
    
    // Handle different export formats
    if (format === 'json') {
      const jsonData = JSON.stringify(exportData, null, 2);
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="feedback_export_${formatDate(startDate)}_to_${formatDate(endDate)}.json"`);
      return res.send(jsonData);
    }
    
    if (format === 'csv') {
      // Define CSV headers
      const headers = [
        'Feedback ID', 'Type', 'Original Input', 'Input Type', 'AI Status', 
        'AI Reason', 'AI Tips', 'User Email', 'User Country', 'Health Conditions', 
        'Allergies', 'Subscription', 'Date', 'Is Problematic', 'Month', 'Year'
      ];
      
      // Convert data to CSV rows
      const csvRows = [headers.join(',')];
      
      for (const item of exportData) {
        const row = [
          `"${item.feedbackId}"`,
          item.feedbackType,
          `"${item.originalInput.replace(/"/g, '""')}"`,
          item.inputType,
          item.aiStatus,
          `"${item.aiReason.replace(/"/g, '""')}"`,
          `"${item.aiTips.join('; ').replace(/"/g, '""')}"`,
          `"${item.userEmail}"`,
          item.userCountry,
          `"${item.userHealthConditions.join('; ')}"`,
          `"${item.userAllergies.join('; ')}"`,
          item.userSubscription,
          item.dateOnly,
          item.isProblematic,
          item.month,
          item.year
        ];
        csvRows.push(row.join(','));
      }
      
      const csvData = csvRows.join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="feedback_export_${formatDate(startDate)}_to_${formatDate(endDate)}.csv"`);
      return res.send(csvData);
    }
    
    if (format === 'pdf') {
      // Generate PDF with all fields
      const pdfBuffer = await generatePDF(exportData, startDate, endDate, feedbackType);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="feedback_export_${formatDate(startDate)}_to_${formatDate(endDate)}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      return res.send(pdfBuffer);
    }
    
    res.status(400).json({ success: false, error: 'Invalid format specified' });
    
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ success: false, error: 'Failed to export feedback data' });
  }
};

// Get export statistics (optional - for summary before export)
const getExportStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const stats = await Feedback.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(startDate),
            $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
          }
        }
      },
      {
        $group: {
          _id: '$feedbackType',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const total = stats.reduce((sum, s) => sum + s.count, 0);
    const goodCount = stats.find(s => s._id === 'good')?.count || 0;
    const badCount = stats.find(s => s._id === 'bad')?.count || 0;
    
    res.json({
      success: true,
      data: {
        total,
        good: goodCount,
        bad: badCount,
        accuracyRate: total > 0 ? ((goodCount / total) * 100).toFixed(1) : 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get export stats' });
  }
};

module.exports = { exportFeedback, getExportStats };