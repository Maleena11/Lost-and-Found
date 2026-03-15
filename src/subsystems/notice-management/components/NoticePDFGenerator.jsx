import React, { useState } from 'react';
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';

// Create styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: '#ffffff',
  },
  section: {
    margin: 10,
    padding: 10,
  },
  header: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 20,
    color: '#1a56db',
    fontWeight: 'bold',
  },
  subheader: {
    fontSize: 16,
    marginBottom: 10,
    color: '#1a56db',
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  statBox: {
    width: '48%',
    margin: '1%',
    padding: 10,
    backgroundColor: '#f3f4f6',
    borderRadius: 5,
  },
  statTitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  table: {
    display: 'table',
    width: '100%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginTop: 10,
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    borderBottomStyle: 'solid',
    alignItems: 'center',
    minHeight: 24,
  },
  tableRowHeader: {
    backgroundColor: '#f9fafb',
  },
  tableColHeader: {
    width: '25%',
    padding: 5,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
  },
  tableCol: {
    width: '25%',
    padding: 5,
    fontSize: 10,
  },
  priorityPill: {
    padding: '2 5',
    borderRadius: 12,
    fontSize: 10,
    alignSelf: 'flex-start',
  },
  lowPriority: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
  },
  mediumPriority: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },
  highPriority: {
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
  },
  urgentPriority: {
    backgroundColor: '#dc2626',
    color: '#ffffff',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 10,
    color: '#9ca3af',
  },
  dateText: {
    fontSize: 10,
    marginBottom: 10,
    fontStyle: 'italic',
    color: '#6b7280',
    textAlign: 'right',
  },
  filterSummary: {
    fontSize: 11,
    marginTop: 10,
    color: '#4b5563',
    fontStyle: 'italic',
  }
});

// PriorityPill component defined separately
const PriorityPill = ({ priority }) => {
  let priorityStyle = {};

  switch (priority?.toLowerCase()) {
    case 'low':
      priorityStyle = styles.lowPriority;
      break;
    case 'medium':
      priorityStyle = styles.mediumPriority;
      break;
    case 'high':
      priorityStyle = styles.highPriority;
      break;
    case 'urgent':
      priorityStyle = styles.urgentPriority;
      break;
    default:
      priorityStyle = styles.mediumPriority;
  }

  return (
    <Text style={[styles.priorityPill, priorityStyle]}>
      {priority ? (priority.charAt(0).toUpperCase() + priority.slice(1)) : 'Medium'}
    </Text>
  );
};

// PDF Document structure
const NoticePDF = ({ data }) => {
  // Add validation and default values to prevent null errors
  if (!data) data = {};
  const stats = data.stats || {
    total: 0,
    announcement: 0,
    serviceUpdate: 0,
    emergency: 0,
    general: 0,
    advisory: 0
  };
  
  const notices = data.notices || [];
  const title = data.title || "Notice Management Report";
  const filterSummary = data.filterSummary || "";

  // Count priorities
  const priorityCounts = {
    urgent: notices.filter(n => n.priority === 'urgent').length,
    high: notices.filter(n => n.priority === 'high').length,
    medium: notices.filter(n => n.priority === 'medium').length,
    low: notices.filter(n => n.priority === 'low').length
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* PDF Header */}
        <View style={styles.section}>
          <Text style={styles.header}>{title}</Text>
          <Text style={styles.dateText}>Generated on: {new Date().toLocaleDateString()}</Text>
          {filterSummary && <Text style={styles.filterSummary}>{filterSummary}</Text>}
        </View>

        {/* Stats Overview */}
        <View style={styles.section}>
          <Text style={styles.subheader}>Overview</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statTitle}>Total Notices</Text>
              <Text style={styles.statValue}>{stats.total}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statTitle}>Announcements</Text>
              <Text style={styles.statValue}>{stats.announcement}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statTitle}>Emergency</Text>
              <Text style={styles.statValue}>{stats.emergency}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statTitle}>Service Updates</Text>
              <Text style={styles.statValue}>{stats.serviceUpdate}</Text>
            </View>
          </View>
        </View>

        {/* Priority Stats */}
        <View style={styles.section}>
          <Text style={styles.subheader}>Priority Breakdown</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statTitle}>Urgent</Text>
              <Text style={styles.statValue}>{priorityCounts.urgent}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statTitle}>High</Text>
              <Text style={styles.statValue}>{priorityCounts.high}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statTitle}>Medium</Text>
              <Text style={styles.statValue}>{priorityCounts.medium}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statTitle}>Low</Text>
              <Text style={styles.statValue}>{priorityCounts.low}</Text>
            </View>
          </View>
        </View>

        {/* Notices Table */}
        <View style={styles.section}>
          <Text style={styles.subheader}>Notice List</Text>
          <View style={styles.table}>
            {/* Table Header */}
            <View style={[styles.tableRow, styles.tableRowHeader]}>
              <Text style={styles.tableColHeader}>Title</Text>
              <Text style={styles.tableColHeader}>Category</Text>
              <Text style={styles.tableColHeader}>Priority</Text>
              <Text style={styles.tableColHeader}>Date Range</Text>
            </View>

            {/* Table Rows */}
            {notices.slice(0, 15).map((notice, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.tableCol}>{notice.title || 'N/A'}</Text>
                <Text style={styles.tableCol}>
                  {(notice.category?.charAt(0).toUpperCase() + notice.category?.slice(1)) || 'N/A'}
                </Text>
                <View style={styles.tableCol}>
                  <PriorityPill priority={notice.priority} />
                </View>
                <Text style={styles.tableCol}>
                  {new Date(notice.startDate).toLocaleDateString()}
                  {notice.endDate ? ` - ${new Date(notice.endDate).toLocaleDateString()}` : ''}
                </Text>
              </View>
            ))}
            
            {/* Show message if there are more notices */}
            {notices.length > 15 && (
              <View style={styles.tableRow}>
                <Text style={[styles.tableCol, { width: '100%', textAlign: 'center', fontStyle: 'italic' }]}>
                  ... and {notices.length - 15} more notices
                </Text>
              </View>
            )}
            
            {/* Show message if no notices */}
            {notices.length === 0 && (
              <View style={styles.tableRow}>
                <Text style={[styles.tableCol, { width: '100%', textAlign: 'center', fontStyle: 'italic' }]}>
                  No notices found
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Audience Distribution */}
        <View style={styles.section}>
          <Text style={styles.subheader}>Target Audience Distribution</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableRowHeader]}>
              <Text style={styles.tableColHeader}>Audience Type</Text>
              <Text style={styles.tableColHeader}>Count</Text>
            </View>
            
            <View style={styles.tableRow}>
              <Text style={styles.tableCol}>All Users</Text>
              <Text style={styles.tableCol}>
                {notices.filter(n => n.targetAudience === 'all-users').length}
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableCol}>Passengers</Text>
              <Text style={styles.tableCol}>
                {notices.filter(n => n.targetAudience === 'passengers').length}
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableCol}>Staff</Text>
              <Text style={styles.tableCol}>
                {notices.filter(n => n.targetAudience === 'staff').length}
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableCol}>Drivers</Text>
              <Text style={styles.tableCol}>
                {notices.filter(n => n.targetAudience === 'drivers').length}
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableCol}>Admin</Text>
              <Text style={styles.tableCol}>
                {notices.filter(n => n.targetAudience === 'admin').length}
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Government Public Transport Notice Management System</Text>
          <Text>© {new Date().getFullYear()} - All Rights Reserved</Text>
        </View>
      </Page>
    </Document>
  );
};

// Main PDF Generator Component with Direct Download Button
const NoticePDFGenerator = ({ notices, filterSummary = "" }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Prepare stats for the report
  const prepareData = () => {
    const validNotices = Array.isArray(notices) ? notices : [];
    
    // Calculate stats
    const stats = {
      total: validNotices.length,
      announcement: validNotices.filter(n => n.category === 'announcement').length,
      serviceUpdate: validNotices.filter(n => n.category === 'service-update').length,
      emergency: validNotices.filter(n => n.category === 'emergency').length,
      general: validNotices.filter(n => n.category === 'general').length,
      advisory: validNotices.filter(n => n.category === 'advisory').length
    };
    
    return {
      stats,
      notices: validNotices,
      title: "Notice Management Report",
      filterSummary
    };
  };
  
  const generatePdf = async () => {
    setIsGenerating(true);
    try {
      const fileName = `notice-management-report-${new Date().toISOString().split('T')[0]}.pdf`;
      
      // Prepare data for PDF
      const reportData = prepareData();
      
      // Create PDF
      const blob = await pdf(<NoticePDF data={reportData} />).toBlob();
      const url = URL.createObjectURL(blob);
      
      // Create a link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate notice report: ' + (error.message || 'Unknown error'));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      onClick={generatePdf}
      disabled={isGenerating}
      className="relative flex items-center gap-2.5 bg-white/15 hover:bg-white/25 active:scale-95 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all duration-200 border border-white/25 shadow-sm hover:shadow-md disabled:opacity-60 overflow-hidden group"
    >
      {/* Subtle shimmer on hover */}
      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out pointer-events-none"></span>

      {isGenerating ? (
        <>
          <div className="relative w-4 h-4 flex-shrink-0">
            <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <span className="flex flex-col items-start leading-none">
            <span className="text-xs font-bold">Generating...</span>
            <span className="text-[10px] text-white/60 font-normal">Please wait</span>
          </span>
        </>
      ) : (
        <>
          <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0 shadow-inner">
            <i className="fas fa-file-download text-sm"></i>
          </div>
          <span className="flex flex-col items-start leading-none">
            <span className="text-xs font-bold tracking-wide">Generate Report</span>
            <span className="text-[10px] text-white/60 font-normal">Export as PDF</span>
          </span>
        </>
      )}
    </button>
  );
};

export default NoticePDFGenerator;