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
  statusPill: {
    padding: '2 5',
    borderRadius: 12,
    fontSize: 10,
    alignSelf: 'flex-start',
  },
  pendingStatus: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },
  claimedStatus: {
    backgroundColor: '#d1fae5',
    color: '#065f46',
  },
  returnedStatus: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
  },
  expiredStatus: {
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
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

// StatusPill component defined separately
const StatusPill = ({ status }) => {
  let statusStyle = {};

  switch (status?.toLowerCase()) {
    case 'pending':
      statusStyle = styles.pendingStatus;
      break;
    case 'claimed':
      statusStyle = styles.claimedStatus;
      break;
    case 'returned':
      statusStyle = styles.returnedStatus;
      break;
    case 'expired':
      statusStyle = styles.expiredStatus;
      break;
    default:
      statusStyle = {};
  }

  return (
    <Text style={[styles.statusPill, statusStyle]}>
      {status ? (status.charAt(0).toUpperCase() + status.slice(1)) : 'Unknown'}
    </Text>
  );
};

// PDF Document structure
const LostFoundPDF = ({ data }) => {
  // Add validation and default values to prevent null errors
  if (!data) data = {};
  const stats = data.stats || {
    totalItems: 0,
    lostItems: 0,
    foundItems: 0,
    claimedItems: 0,
    returnedItems: 0
  };
  
  const items = data.items || [];
  const title = data.title || "Lost and Found Report";
  const filterSummary = data.filterSummary || "";

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
              <Text style={styles.statTitle}>Total Items</Text>
              <Text style={styles.statValue}>{stats.totalItems}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statTitle}>Lost Items</Text>
              <Text style={styles.statValue}>{stats.lostItems}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statTitle}>Found Items</Text>
              <Text style={styles.statValue}>{stats.foundItems}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statTitle}>Claimed/Returned</Text>
              <Text style={styles.statValue}>{(stats.claimedItems || 0) + (stats.returnedItems || 0)}</Text>
            </View>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.section}>
          <Text style={styles.subheader}>Items List</Text>
          <View style={styles.table}>
            {/* Table Header */}
            <View style={[styles.tableRow, styles.tableRowHeader]}>
              <Text style={styles.tableColHeader}>Item Name</Text>
              <Text style={styles.tableColHeader}>Type</Text>
              <Text style={styles.tableColHeader}>Location</Text>
              <Text style={styles.tableColHeader}>Status</Text>
            </View>

            {/* Table Rows */}
            {items.slice(0, 15).map((item, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.tableCol}>{item.itemName || 'N/A'}</Text>
                <Text style={styles.tableCol}>{item.itemType === 'lost' ? 'Lost' : 'Found'}</Text>
                <Text style={styles.tableCol}>{item.location || 'N/A'}</Text>
                <View style={styles.tableCol}>
                  <StatusPill status={item.status} />
                </View>
              </View>
            ))}
            
            {/* Show message if there are more items */}
            {items.length > 15 && (
              <View style={styles.tableRow}>
                <Text style={[styles.tableCol, { width: '100%', textAlign: 'center', fontStyle: 'italic' }]}>
                  ... and {items.length - 15} more items
                </Text>
              </View>
            )}
            
            {/* Show message if no items */}
            {items.length === 0 && (
              <View style={styles.tableRow}>
                <Text style={[styles.tableCol, { width: '100%', textAlign: 'center', fontStyle: 'italic' }]}>
                  No items found
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Category Stats */}
        {stats.categoryBreakdown && Object.keys(stats.categoryBreakdown).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.subheader}>Category Breakdown</Text>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableRowHeader]}>
                <Text style={styles.tableColHeader}>Category</Text>
                <Text style={styles.tableColHeader}>Count</Text>
              </View>
              
              {Object.entries(stats.categoryBreakdown).map(([category, count], index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={styles.tableCol}>{category.charAt(0).toUpperCase() + category.slice(1)}</Text>
                  <Text style={styles.tableCol}>{count}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Government Public Transport Lost and Found System</Text>
          <Text>© {new Date().getFullYear()} - All Rights Reserved</Text>
        </View>
      </Page>
    </Document>
  );
};

// Main PDF Generator Component with Direct Download Button
const PDFGenerator = ({ data }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Validate and prepare data to avoid null errors
  const validateData = () => {
    // Create a safe copy with default values
    const safeData = {
      stats: {
        totalItems: 0,
        lostItems: 0,
        foundItems: 0,
        claimedItems: 0,
        returnedItems: 0,
        expiredItems: 0,
        categoryBreakdown: {},
        ...(data?.stats || {})
      },
      items: Array.isArray(data?.items) ? data.items : [],
      title: data?.title || "Lost and Found Report",
      filterSummary: data?.filterSummary || ""
    };
    
    return safeData;
  };
  
  const generatePdf = async () => {
    setIsGenerating(true);
    try {
      const fileName = `lost-found-report-${new Date().toISOString().split('T')[0]}.pdf`;
      
      // Use validated data
      const safeData = validateData();
      
      // Create PDF
      const blob = await pdf(<LostFoundPDF data={safeData} />).toBlob();
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
      alert('Failed to generate PDF report: ' + (error.message || 'Unknown error'));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      onClick={generatePdf}
      disabled={isGenerating}
      className="bg-blue-800 hover:bg-blue-900 text-white px-4 py-2 rounded-md text-sm flex items-center disabled:bg-blue-300"
    >
      {isGenerating ? (
        <>
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Generating PDF...
        </>
      ) : (
        <>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5 mr-2" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
            />
          </svg>
          Download PDF Report
        </>
      )}
    </button>
  );
};

export default PDFGenerator;