const express = require('express');
const router = express.Router();
const events = require('../models/events');
const { fixImageUrl } = require('../utils/imageUrlUtils');

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
      // Parse the datetime string and treat it as the intended local time
      // regardless of server timezone
      const date = new Date(dateString);
      
      // Extract hours and minutes directly to avoid timezone conversion issues
      const timeString = dateString.match(/(\d{1,2}):(\d{2})/);
      if (timeString) {
        const hours = parseInt(timeString[1]);
        const minutes = parseInt(timeString[2]);
        
        // Format manually to preserve the original time
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
        const displayMinutes = minutes.toString().padStart(2, '0');
        
        return `${displayHours}:${displayMinutes} ${period}`;
      }
      
      // Fallback to original method if regex doesn't match
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    };

    // Fix image URL if it contains localhost
    const fixedImageUrl = event.image_url ? fixImageUrl(event.image_url) : '';
    
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
        <meta property="og:image" content="${fixedImageUrl}">
        <meta property="og:url" content="${req.protocol}://${req.get('host')}/events/${event.id}">
        <meta property="og:type" content="event">
        <meta property="og:site_name" content="Updates">
        
        <!-- Twitter Card meta tags -->
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="${event.title}">
        <meta name="twitter:description" content="${event.description || `Join us for ${event.title} at ${event.church_name}`}">
        <meta name="twitter:image" content="${fixedImageUrl}">
        
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
          
          .download-buttons {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
          }
          
          .download-button {
            background: #000;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 500;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            transition: transform 0.2s;
            margin: 0 5px;
            font-size: 14px;
            min-width: 160px;
            justify-content: center;
          }
          
          .download-button:hover {
            transform: scale(1.05);
          }
          
          .ios-button {
            background: #000;
            color: white;
          }
          
          .android-button {
            background: #000;
            color: white;
          }
          
          .web-button {
            background: #3498db;
            color: white;
          }
          
          .store-icon {
            width: 20px;
            height: 20px;
          }
          
          .button-text {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            line-height: 1.2;
          }
          
          .button-subtitle {
            font-size: 10px;
            opacity: 0.8;
            font-weight: 400;
          }
          
          .button-title {
            font-size: 14px;
            font-weight: 500;
          }
          
          .footer-buttons {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 10px;
            margin-bottom: 15px;
          }
          
          .android-message {
            color: white;
            font-size: 0.9rem;
            opacity: 0.8;
            font-style: italic;
            text-align: center;
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
            <div class="download-buttons">
              <a href="https://apps.apple.com/us/app/churchupdates/id6749280219" target="_blank" class="download-button ios-button">
                <svg class="store-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                <div class="button-text">
                  <div class="button-subtitle">Download on the</div>
                  <div class="button-title">App Store</div>
                </div>
              </a>
              <a href="https://play.google.com/store/apps/details?id=com.mezalonmax.updates&pcampaignid=web_share" target="_blank" class="download-button android-button">
                <svg class="store-icon" viewBox="0 0 24 24">
                  <defs>
                    <linearGradient id="playGradientBlue" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style="stop-color:#00D4FF"/>
                      <stop offset="100%" style="stop-color:#0099CC"/>
                    </linearGradient>
                    <linearGradient id="playGradientYellow" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style="stop-color:#FFD500"/>
                      <stop offset="100%" style="stop-color:#FF9500"/>
                    </linearGradient>
                    <linearGradient id="playGradientRed" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style="stop-color:#FF4444"/>
                      <stop offset="100%" style="stop-color:#CC0000"/>
                    </linearGradient>
                    <linearGradient id="playGradientGreen" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style="stop-color:#00E676"/>
                      <stop offset="100%" style="stop-color:#00C853"/>
                    </linearGradient>
                  </defs>
                  <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.61 3,21.09 3,20.5" fill="url(#playGradientBlue)"/>
                  <path d="M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12" fill="url(#playGradientYellow)"/>
                  <path d="M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81" fill="url(#playGradientRed)"/>
                  <path d="M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66" fill="url(#playGradientGreen)"/>
                </svg>
                <div class="button-text">
                  <div class="button-subtitle">GET IT ON</div>
                  <div class="button-title">Google Play</div>
                </div>
              </a>
            </div>
          </div>
          
          <!-- Header -->
          <div class="header">
            <h1>Updates</h1>
          </div>
          
          <!-- Event Image -->
          ${fixedImageUrl ? `<img src="${fixedImageUrl}" alt="${event.title}" class="event-image">` : ''}
          
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
              Download our mobile app or visit our web app to explore events from churches in your area, 
              save favorites, and never miss what's happening in your community.
            </div>
            <div class="footer-buttons">
              <a href="https://apps.apple.com/us/app/churchupdates/id6749280219" target="_blank" class="download-button ios-button">
                <svg class="store-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                <div class="button-text">
                  <div class="button-subtitle">Download on the</div>
                  <div class="button-title">App Store</div>
                </div>
              </a>
              <a href="https://play.google.com/store/apps/details?id=com.mezalonmax.updates&pcampaignid=web_share" target="_blank" class="download-button android-button">
                <svg class="store-icon" viewBox="0 0 24 24">
                  <defs>
                    <linearGradient id="playGradientBlue" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style="stop-color:#00D4FF"/>
                      <stop offset="100%" style="stop-color:#0099CC"/>
                    </linearGradient>
                    <linearGradient id="playGradientYellow" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style="stop-color:#FFD500"/>
                      <stop offset="100%" style="stop-color:#FF9500"/>
                    </linearGradient>
                    <linearGradient id="playGradientRed" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style="stop-color:#FF4444"/>
                      <stop offset="100%" style="stop-color:#CC0000"/>
                    </linearGradient>
                    <linearGradient id="playGradientGreen" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style="stop-color:#00E676"/>
                      <stop offset="100%" style="stop-color:#00C853"/>
                    </linearGradient>
                  </defs>
                  <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.61 3,21.09 3,20.5" fill="url(#playGradientBlue)"/>
                  <path d="M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12" fill="url(#playGradientYellow)"/>
                  <path d="M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81" fill="url(#playGradientRed)"/>
                  <path d="M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66" fill="url(#playGradientGreen)"/>
                </svg>
                <div class="button-text">
                  <div class="button-subtitle">GET IT ON</div>
                  <div class="button-title">Google Play</div>
                </div>
              </a>
              <a href="https://mychurchupdates.netlify.app" target="_blank" class="download-button web-button">
                🌐 Visit Web App
              </a>
            </div>
          </div>
        </div>
        
        <script>
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
