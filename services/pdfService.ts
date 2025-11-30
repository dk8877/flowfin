
import { Transaction, TransactionType } from '../types';

const SCRIPTS = {
    JSPDF: 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
    AUTOTABLE: 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js'
};

const loadScript = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
        document.head.appendChild(script);
    });
};

export const pdfService = {
    generateReport: async (transactions: Transaction[], title: string, subtitle?: string) => {
        try {
            // Dynamically load libraries
            await loadScript(SCRIPTS.JSPDF);
            await loadScript(SCRIPTS.AUTOTABLE);

            // Access global jsPDF
            const { jsPDF } = (window as any).jspdf;
            const doc = new jsPDF();
            const width = doc.internal.pageSize.getWidth();

            // --- HEADER ---
            // App Name
            doc.setFontSize(22);
            doc.setTextColor(16, 185, 129); // Emerald 500
            doc.text("FlowFin", 14, 20);
            
            // Title
            doc.setFontSize(16);
            doc.setTextColor(40, 40, 40);
            doc.text(title, 14, 30);

            // Subtitle / Date
            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            const dateStr = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString();
            doc.text(subtitle || `Generated on: ${dateStr}`, 14, 36);

            // --- SUMMARY METRICS ---
            let totalIn = 0;
            let totalOut = 0;
            
            const tableRows = transactions.map(t => {
                const isExpense = t.type === TransactionType.SPENT || t.type === TransactionType.LENT;
                if (t.type === TransactionType.RECEIVED) totalIn += t.amount;
                if (t.type === TransactionType.SPENT) totalOut += t.amount;
                
                return [
                    new Date(t.date).toLocaleDateString(),
                    t.description,
                    t.category,
                    t.type,
                    `${isExpense ? '-' : '+'} ${t.amount.toFixed(2)}`
                ];
            });

            // --- TABLE ---
            (doc as any).autoTable({
                startY: 45,
                head: [['Date', 'Description', 'Category', 'Type', 'Amount']],
                body: tableRows,
                theme: 'grid',
                styles: {
                    fontSize: 9,
                    cellPadding: 3,
                    font: "helvetica"
                },
                headStyles: {
                    fillColor: [245, 158, 11], // Amber 500
                    textColor: [255, 255, 255],
                    fontStyle: 'bold'
                },
                columnStyles: {
                    4: { halign: 'right', fontStyle: 'bold' }
                },
                alternateRowStyles: {
                    fillColor: [249, 250, 251] // Slate 50
                }
            });

            // --- FOOTER SUMMARY ---
            const finalY = (doc as any).lastAutoTable.finalY + 10;
            
            doc.setFontSize(10);
            doc.setTextColor(40, 40, 40);
            doc.text(`Total Income: ${totalIn.toFixed(2)}`, 14, finalY);
            doc.text(`Total Expenses: ${totalOut.toFixed(2)}`, 14, finalY + 5);
            
            const net = totalIn - totalOut;
            doc.setFontSize(12);
            doc.setTextColor(net >= 0 ? 16 : 220, net >= 0 ? 185 : 38, net >= 0 ? 129 : 38); // Green or Red
            doc.text(`Net Flow: ${net >= 0 ? '+' : ''}${net.toFixed(2)}`, 14, finalY + 12);

            // Save
            doc.save(`${title.replace(/\s+/g, '_')}_Report.pdf`);

        } catch (error) {
            console.error("PDF Generation failed:", error);
            alert("Failed to generate PDF. Please check your internet connection.");
        }
    }
};
