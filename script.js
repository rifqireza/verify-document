import CryptoJS from "crypto-js";
import { PDFDocument } from "pdf-lib";
import qrcode from "qrcode-generator";
import jsQR from "jsqr";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.js";
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

function onChange(e) {
  const fileName = document.getElementById("file-name");
  if (e.target.files && e.target.files.length > 0) {
    fileName.textContent = e.target.files[0].name;
  }
}

async function embedQR() {
  const file = document.getElementById("file").files[0];
  const key = document.getElementById("key").value;
  if (!file || !key) {
    alert("Please select a PDF and enter a key.");
    return;
  }

  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const fileHash = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const ciphertext = CryptoJS.AES.encrypt(fileHash, key).toString();

  const qr = qrcode(0, "H");
  qr.addData(ciphertext);
  qr.make();
  const qrCanvas = document.createElement("canvas");
  const cellSize = 8;
  qrCanvas.width = qr.getModuleCount() * cellSize;
  qrCanvas.height = qr.getModuleCount() * cellSize;
  const qrCtx = qrCanvas.getContext("2d");
  qrCtx.fillStyle = "#FFFFFF";
  qrCtx.fillRect(0, 0, qrCanvas.width, qrCanvas.height);
  qrCtx.fillStyle = "#000000";
  for (let r = 0; r < qr.getModuleCount(); r++) {
    for (let c = 0; c < qr.getModuleCount(); c++) {
      if (qr.isDark(r, c)) {
        qrCtx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
      }
    }
  }
  const qrDataUrl = qrCanvas.toDataURL("image/png");

  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const firstPage = pdfDoc.getPages()[0];
  const qrImage = await pdfDoc.embedPng(qrDataUrl);
  const { width } = firstPage.getSize();
  const qrDim = 100;
  firstPage.drawImage(qrImage, {
    x: width - qrDim - 20,
    y: 20,
    width: qrDim,
    height: qrDim,
    opacity: 0.5,
  });

  const modifiedPdfBytes = await pdfDoc.save();
  const blob = new Blob([modifiedPdfBytes], { type: "application/pdf" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "document_with_qr.pdf";
  link.click();
}

async function verifyPDF() {
  const file = document.getElementById("file").files[0];
  const key = document.getElementById("key").value;
  if (!file || !key) {
    alert("Please select a PDF and enter a key.");
    return;
  }

  const pdfData = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 4.0 });

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  await page.render({ canvasContext: context, viewport: viewport }).promise;

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const qrCode = jsQR(imageData.data, canvas.width, canvas.height);
  if (!qrCode) {
    document.getElementById("verificationResult").textContent =
      "QR code not found.";
    return;
  }

  const bytes = CryptoJS.AES.decrypt(qrCode.data, key);

  let originalHash;
  try {
    originalHash = bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    document.getElementById("verificationResult").textContent =
      "Failed to verified PDF. Wrong key?";
    return;
  }

  if (!originalHash) {
    document.getElementById("verificationResult").textContent =
      "Failed to verified PDF. Wrong key?";
    return;
  }

  document.getElementById("verificationResult").textContent =
    "PDF verified. Original hash: " + originalHash;
}

document.getElementById("btnEmbed").addEventListener("click", embedQR);
document.getElementById("btnVerify").addEventListener("click", verifyPDF);
document.getElementById("file").addEventListener("change", onChange);
