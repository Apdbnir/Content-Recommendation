document.addEventListener('DOMContentLoaded', () => {
    // Initialize PDF.js
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

    // Get DOM elements
    const pdfLoading = document.getElementById('pdf-loading');
    const pdfContainer = document.getElementById('pdf-container');

    // Path to the PDF file on the server
    const pdfUrl = '/Doc.pdf'; // Server route to serve the PDF from project root

    // PDF variables
    let pdfDoc = null;
    let scale = 1.5; // Scale for display

    // Load PDF from server
    function loadPdf() {
        pdfjsLib.getDocument(pdfUrl).promise.then(function(pdf) {
            pdfDoc = pdf;
            
            // Clear loading message
            pdfLoading.classList.add('hidden');
            
            // Render all pages
            renderAllPages();
        }).catch((error) => {
            console.error('Error loading PDF:', error);
            pdfLoading.innerHTML = '<p>Error loading documentation. Please try again later.</p>';
            pdfLoading.classList.remove('hidden');
        });
    }

    // Render all pages for scrollable view
    function renderAllPages() {
        if (!pdfDoc) return;

        // Clear the container
        pdfContainer.innerHTML = '';

        // Render each page
        for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
            const pageContainer = document.createElement('div');
            pageContainer.className = 'pdf-page';
            pageContainer.id = `page-container-${pageNum}`;
            
            const canvas = document.createElement('canvas');
            canvas.id = `pdf-canvas-${pageNum}`;
            
            pageContainer.appendChild(canvas);
            pdfContainer.appendChild(pageContainer);

            // Render the page after a short delay to allow DOM to update
            renderPage(pageNum, canvas);
        }
    }

    // Render a single page
    function renderPage(pageNum, canvas) {
        pdfDoc.getPage(pageNum).then(function(page) {
            const context = canvas.getContext('2d');
            const viewport = page.getViewport({ scale: scale });
            
            // Set canvas dimensions
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            
            // Render page
            const renderContext = {
                canvasContext: context,
                viewport: viewport
            };
            
            const renderTask = page.render(renderContext);
            renderTask.promise.then(function() {
                // Page rendered successfully
            }).catch((error) => {
                console.error('Error rendering page:', error);
            });
        }).catch((error) => {
            console.error('Error getting page:', error);
        });
    }

    // Load the PDF when the page loads
    loadPdf();

    // Initialize translations
    const currentLang = localStorage.getItem('language') || 'ru';
    applyTranslations(currentLang);
    
    // Listen for language change events
    document.addEventListener('languageChanged', async () => {
        const lang = localStorage.getItem('language') || 'ru';
        await applyTranslations(lang);
    });
});