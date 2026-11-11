import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

export const generateVoterCard = async (voter, res) => {
  const doc = new PDFDocument({
    size: [400, 250], // ID Card size
    margin: 0
  });

  doc.pipe(res);

  // 1. Background
  doc.rect(0, 0, 400, 50).fill('#172554');
  doc.rect(0, 50, 400, 200).fill('#f8fafc');

  // 2. Header Text
  doc.fillColor('#ffffff').fontSize(16).font('Helvetica-Bold').text('VRS KENYA', 20, 15);
  doc.fontSize(10).font('Helvetica').text('Administrative Voter ID', 20, 30);

  // 3. Voter Details
  doc.fillColor('#172554').fontSize(14).font('Helvetica-Bold').text(voter.fullName, 20, 70);
  
  doc.fontSize(9).font('Helvetica').fillColor('#64748b');
  doc.text('REFERENCE NUMBER', 20, 100);
  doc.fontSize(11).fillColor('#1e293b').font('Helvetica-Bold').text(voter.referenceNumber, 20, 112);

  doc.fontSize(9).font('Helvetica').fillColor('#64748b');
  doc.text('NATIONAL ID', 20, 135);
  doc.fontSize(11).fillColor('#1e293b').font('Helvetica-Bold').text(voter.idNumber || 'N/A', 20, 147);

  doc.fontSize(9).font('Helvetica').fillColor('#64748b');
  doc.text('LOCATION', 20, 170);
  doc.fontSize(10).fillColor('#1e293b').font('Helvetica').text(`${voter.ward?.name || 'Ward'}, ${voter.county?.name || 'County'}`, 20, 182);

  // 4. QR Code
  try {
    const qrData = `https://vrs-frontend.onrender.com/verify-vote?code=${voter.referenceNumber}`;
    const qrImage = await QRCode.toDataURL(qrData, { margin: 1, width: 120 });
    const base64Data = qrImage.replace(/^data:image\/png;base64,/, "");
    const qrBuffer = Buffer.from(base64Data, 'base64');
    doc.image(qrBuffer, 260, 80, { width: 110 });
  } catch (err) {
    console.error('QR Error:', err);
  }

  // 5. Footer
  doc.fontSize(7).fillColor('#94a3b8').font('Helvetica-Oblique');
  doc.text('Demo/Administrative System — Not an official election registration platform.', 20, 225, { width: 360, align: 'center' });

  doc.end();
}; // <--- THIS WAS MISSING

export const generateAuditReport = async (election, results, res) => {
  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(res);

  // Header
  doc.fillColor('#172554').fontSize(24).font('Helvetica-Bold').text('Election Audit Report', { align: 'center' });
  doc.fontSize(14).font('Helvetica').fillColor('#64748b').text(election.title, { align: 'center' });
  doc.moveDown(2);

  // Summary Box
  doc.rect(50, doc.y, 500, 80).fill('#f8fafc');
  doc.fillColor('#1e293b').fontSize(12).font('Helvetica-Bold');
  const startY = doc.y - 65;
  doc.text(`Total Registered Voters: ${results.totalVoters}`, 70, startY);
  doc.text(`Total Votes Cast: ${results.totalVotesCast}`, 70, startY + 20);
  doc.text(`Overall Turnout: ${results.turnoutPercent}%`, 70, startY + 40);
  doc.moveDown(3);

  // Positions & Winners
  doc.fillColor('#172554').fontSize(16).font('Helvetica-Bold').text('Results by Position');
  doc.moveDown(1);

  results.positions.forEach((pos) => {
    if (doc.y > 650) doc.addPage();

    doc.fillColor('#1e293b').fontSize(14).font('Helvetica-Bold').text(pos.title);
    doc.fontSize(10).font('Helvetica').fillColor('#64748b').text(`Total votes: ${pos.totalVotes}`);
    doc.moveDown(0.5);

    pos.candidates.slice(0, 3).forEach((c, i) => {
      const prefix = i === 0 ? 'WINNER: ' : `${i + 1}. `;
      doc.fontSize(11).fillColor(i === 0 ? '#166534' : '#475569').font(i === 0 ? 'Helvetica-Bold' : 'Helvetica');
      doc.text(`${prefix}${c.name} (${c.party || 'Independent'}) — ${c.votes} votes (${c.percentage}%)`);
    });
    doc.moveDown(1.5);
  });

  doc.fontSize(8).fillColor('#94a3b8').text('Demo/Administrative System — Not an official election registration platform.', { align: 'center' });
  doc.end();
};