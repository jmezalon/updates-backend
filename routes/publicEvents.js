const express = require('express');
const router = express.Router();
const events = require('../models/events');

// GET /events/:id - Public web view for shared events
router.get('/:id', async (req, res, next) => {
  try {
    const event = await events.getById(req.params.id);
    if (!event) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Event Not Found - Updates</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
        <body>
          <h1>Event Not Found</h1>
          <p>The event you're looking for doesn't exist.</p>
        </body>
        </html>
      `);
    }

    // Format dates for display
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    };

    const formatTime = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    };

    // Generate the HTML with Open Graph meta tags
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>${event.title} - Updates</title>
        
        <!-- Open Graph meta tags for social sharing -->
        <meta property="og:title" content="${event.title}">
        <meta property="og:description" content="${event.description || `Join us for ${event.title} at ${event.church_name}`}">
        <meta property="og:image" content="${event.image_url || ''}">
        <meta property="og:url" content="${req.protocol}://${req.get('host')}/events/${event.id}">
        <meta property="og:type" content="event">
        <meta property="og:site_name" content="Updates">
        
        <!-- Twitter Card meta tags -->
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="${event.title}">
        <meta name="twitter:description" content="${event.description || `Join us for ${event.title} at ${event.church_name}`}">
        <meta name="twitter:image" content="${event.image_url || ''}">
        
        <!-- Favicon and app icons -->
        <link rel="icon" type="image/x-icon" href="/favicon.ico">
        
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
          }
          
          .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            min-height: 100vh;
          }
          
          .header {
            background: #FFB800;
            padding: 20px;
            text-align: center;
          }
          
          .header h1 {
            color: #000;
            font-size: 2rem;
            font-weight: bold;
          }
          
          .app-banner {
            background: #e74c3c;
            color: white;
            padding: 16px 20px;
            text-align: center;
            position: sticky;
            top: 0;
            z-index: 100;
          }
          
          .app-banner-text {
            margin-bottom: 8px;
            font-weight: 600;
          }
          
          .download-button {
            background: white;
            color: #e74c3c;
            border: none;
            padding: 10px 20px;
            border-radius: 25px;
            font-weight: bold;
            text-decoration: none;
            display: inline-block;
            transition: transform 0.2s;
          }
          
          .download-button:hover {
            transform: scale(1.05);
          }
          
          .event-image {
            width: 100%;
            height: 300px;
            object-fit: cover;
            display: block;
          }
          
          .content {
            padding: 20px;
          }
          
          .event-title {
            font-size: 2rem;
            font-weight: bold;
            color: #e74c3c;
            margin-bottom: 16px;
          }
          
          .church-info {
            margin-bottom: 20px;
            padding-bottom: 20px;
            border-bottom: 1px solid #eee;
          }
          
          .church-name {
            font-size: 1.2rem;
            font-weight: 600;
            color: #3498db;
            margin-bottom: 5px;
          }
          
          .location {
            color: #666;
            margin-bottom: 10px;
          }
          
          .section {
            margin-bottom: 24px;
            padding-bottom: 20px;
            border-bottom: 1px solid #eee;
          }
          
          .section:last-child {
            border-bottom: none;
          }
          
          .section-title {
            font-size: 1.2rem;
            font-weight: bold;
            color: #e74c3c;
            margin-bottom: 8px;
          }
          
          .datetime {
            font-size: 1.1rem;
            margin-bottom: 8px;
          }
          
          .price {
            font-size: 1.1rem;
            font-weight: 600;
            color: #27ae60;
          }
          
          .contact-link {
            color: #3498db;
            text-decoration: none;
            display: block;
            margin-bottom: 5px;
          }
          
          .contact-link:hover {
            text-decoration: underline;
          }
          
          .description {
            line-height: 1.8;
            color: #555;
          }
          
          .footer {
            background: #2c3e50;
            color: white;
            padding: 40px 20px;
            text-align: center;
          }
          
          .footer-title {
            font-size: 1.5rem;
            margin-bottom: 16px;
          }
          
          .footer-text {
            margin-bottom: 20px;
            opacity: 0.9;
          }
          
          @media (max-width: 600px) {
            .event-title {
              font-size: 1.5rem;
            }
            
            .header h1 {
              font-size: 1.5rem;
            }
            
            .content {
              padding: 16px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- App Download Banner -->
          <div class="app-banner">
            <div class="app-banner-text">📱 Get the full Updates experience!</div>
            <a href="#" class="download-button" onclick="promptAppDownload()">Download App</a>
          </div>
          
          <!-- Header -->
          <div class="header">
            <h1>Updates</h1>
          </div>
          
          <!-- Event Image -->
          ${event.image_url ? `<img src="${event.image_url}" alt="${event.title}" class="event-image">` : ''}
          
          <!-- Content -->
          <div class="content">
            <h1 class="event-title">${event.title}</h1>
            
            <!-- Church Information -->
            <div class="church-info">
              <div class="church-name">${event.church_name}</div>
              ${event.location ? `<div class="location">📍 ${event.location}</div>` : ''}
            </div>
            
            <!-- Event Details -->
            <div class="section">
              <div class="section-title">📅 When?</div>
              <div class="datetime">
                ${formatDate(event.start_datetime)} at ${formatTime(event.start_datetime)}
              </div>
              ${event.price !== undefined ? `
                <div class="price">
                  💰 ${event.price === 0 ? 'Free' : `$${event.price}`}
                </div>
              ` : ''}
            </div>
            
            <!-- Contact Information -->
            ${event.contact_phone || event.contact_email ? `
              <div class="section">
                <div class="section-title">📞 Contact</div>
                ${event.contact_phone ? `<a href="tel:${event.contact_phone}" class="contact-link">${event.contact_phone}</a>` : ''}
                ${event.contact_email ? `<a href="mailto:${event.contact_email}" class="contact-link">${event.contact_email}</a>` : ''}
              </div>
            ` : ''}
            
            <!-- Website -->
            ${event.website ? `
              <div class="section">
                <div class="section-title">🌐 Website</div>
                <a href="${event.website}" target="_blank" class="contact-link">${event.website}</a>
              </div>
            ` : ''}
            
            <!-- Description -->
            ${event.description ? `
              <div class="section">
                <div class="section-title">📝 About This Event</div>
                <div class="description">${event.description}</div>
              </div>
            ` : ''}
          </div>
          
          <!-- Footer with App Promotion -->
          <div class="footer">
            <div class="footer-title">Want to discover more events?</div>
            <div class="footer-text">
              Download the Updates app to explore events from churches in your area, 
              save favorites, and never miss what's happening in your community.
            </div>
            <a href="#" class="download-button" onclick="promptAppDownload()">Get Updates App</a>
          </div>
        </div>
        
        <script>
          function promptAppDownload() {
            // Detect mobile platform and show appropriate download options
            const userAgent = navigator.userAgent || navigator.vendor || window.opera;
            
            if (/android/i.test(userAgent)) {
              // Android - redirect to Play Store (when available)
              alert('Updates app coming soon to Google Play Store!\\n\\nFor now, visit our website to learn more.');
            } else if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
              // iOS - redirect to App Store (when available)
              alert('Updates app coming soon to the App Store!\\n\\nFor now, visit our website to learn more.');
            } else {
              // Desktop or other - show general message
              alert('Download the Updates mobile app to discover more events!\\n\\nComing soon to App Store and Google Play.');
            }
          }
          
          // Add smooth scroll behavior
          document.documentElement.style.scrollBehavior = 'smooth';
        </script>
      </body>
      </html>
    `;

    res.send(html);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
