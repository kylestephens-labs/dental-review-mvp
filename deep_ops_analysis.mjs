import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aeznfrekdipwhhpntvue.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeOpsGaps() {
  const targetCities = ['Berkeley', 'Concord', 'Fremont', 'Oakland', 'Pleasanton', 'Walnut Creek'];
  
  console.log('=== DEEP OPS GAPS ANALYSIS ===\n');
  console.log('Looking beyond "missing website" to find the REAL pain points...\n');
  
  // Fetch all data
  let allData = [];
  let from = 0;
  const batchSize = 1000;
  
  while (true) {
    const { data, error } = await supabase
      .from('mv_rb_base')
      .select('*')
      .range(from, from + batchSize - 1);
    
    if (error || !data || data.length === 0) break;
    allData = allData.concat(data);
    from += batchSize;
    if (data.length < batchSize) break;
  }
  
  const filtered = allData.filter(b => targetCities.includes(b.city));
  
  console.log(`Total businesses analyzed: ${filtered.length}\n`);
  
  // MULTIPLE OPS GAPS ANALYSIS
  const gaps = {
    'Has Website BUT Low Reviews': { count: 0, businesses: [], severity: 'HIGH' },
    'Has Website BUT Old/Inactive': { count: 0, businesses: [], severity: 'MEDIUM' },
    'Has Phone BUT Missing Website': { count: 0, businesses: [], severity: 'MEDIUM' },
    'Has Reviews BUT No Response Management': { count: 0, businesses: [], severity: 'HIGH' },
    'Low Rating (<4.0) + High Review Count': { count: 0, businesses: [], severity: 'CRITICAL' },
    'High Rating BUT Few Reviews (<20)': { count: 0, businesses: [], severity: 'MEDIUM' },
    'Zero Reviews (New or Inactive)': { count: 0, businesses: [], severity: 'LOW' },
    'Missing Both Website AND Phone': { count: 0, businesses: [], severity: 'LOW' },
  };
  
  filtered.forEach(biz => {
    const hasWebsite = !!biz.website;
    const hasPhone = !!biz.phone;
    const rating = biz.rating ? parseFloat(biz.rating) : 0;
    const reviewCount = biz.review_count || 0;
    
    // Gap 1: Has website BUT very few reviews (reputation problem)
    if (hasWebsite && reviewCount < 20 && reviewCount > 0) {
      gaps['High Rating BUT Few Reviews (<20)'].count++;
      if (gaps['High Rating BUT Few Reviews (<20)'].businesses.length < 5) {
        gaps['High Rating BUT Few Reviews (<20)'].businesses.push({
          name: biz.business_name,
          niche: biz.primary_category,
          city: biz.city,
          rating,
          reviews: reviewCount,
          website: biz.website
        });
      }
    }
    
    // Gap 2: Has website but ZERO reviews (visibility problem)
    if (hasWebsite && reviewCount === 0) {
      gaps['Has Website BUT Low Reviews'].count++;
      if (gaps['Has Website BUT Low Reviews'].businesses.length < 5) {
        gaps['Has Website BUT Low Reviews'].businesses.push({
          name: biz.business_name,
          niche: biz.primary_category,
          city: biz.city,
          website: biz.website
        });
      }
    }
    
    // Gap 3: Phone exists but no website (classic lead gen opportunity)
    if (hasPhone && !hasWebsite) {
      gaps['Has Phone BUT Missing Website'].count++;
      if (gaps['Has Phone BUT Missing Website'].businesses.length < 5) {
        gaps['Has Phone BUT Missing Website'].businesses.push({
          name: biz.business_name,
          niche: biz.primary_category,
          city: biz.city,
          phone: biz.phone
        });
      }
    }
    
    // Gap 4: CRITICAL - Low rating with many reviews (reputation crisis)
    if (rating > 0 && rating < 4.0 && reviewCount >= 20) {
      gaps['Low Rating (<4.0) + High Review Count'].count++;
      if (gaps['Low Rating (<4.0) + High Review Count'].businesses.length < 5) {
        gaps['Low Rating (<4.0) + High Review Count'].businesses.push({
          name: biz.business_name,
          niche: biz.primary_category,
          city: biz.city,
          rating,
          reviews: reviewCount,
          website: biz.website
        });
      }
    }
    
    // Gap 5: Has good reviews but no systematic review generation
    if (hasWebsite && reviewCount >= 20 && rating >= 4.0) {
      gaps['Has Reviews BUT No Response Management'].count++;
    }
    
    // Gap 6: Zero reviews = either new or inactive
    if (reviewCount === 0) {
      gaps['Zero Reviews (New or Inactive)'].count++;
    }
    
    // Gap 7: Missing both (hard to reach)
    if (!hasWebsite && !hasPhone) {
      gaps['Missing Both Website AND Phone'].count++;
    }
  });
  
  console.log('=== OPS GAPS RANKED BY OPPORTUNITY ===\n');
  
  Object.entries(gaps)
    .sort((a, b) => b[1].count - a[1].count)
    .forEach(([gap, data]) => {
      console.log(`${gap}: ${data.count} businesses (Severity: ${data.severity})`);
      if (data.businesses && data.businesses.length > 0) {
        console.log('  Examples:');
        data.businesses.forEach(b => {
          console.log(`    - ${b.name || 'N/A'} (${b.niche}, ${b.city}): rating ${b.rating || 'N/A'}, reviews ${b.reviews || 0}`);
        });
      }
      console.log('');
    });
  
  // OFFERING ANALYSIS
  console.log('\n=== OFFERING OPPORTUNITIES RANKED ===\n');
  
  const offerings = [
    {
      name: 'Review Generation System',
      target_gap: 'High Rating BUT Few Reviews (<20)',
      addressable: gaps['High Rating BUT Few Reviews (<20)'].count + gaps['Has Website BUT Low Reviews'].count,
      pitch: 'Automated review requests via SMS/email after service → 10x your reviews in 90 days',
      pricing: '$200-400/mo',
      ease_of_delivery: 'EASY (n8n workflow + Twilio)',
      time_to_value: '7 days',
      stickiness: 'HIGH (ongoing service)',
      severity: 'HIGH'
    },
    {
      name: 'Lead Gen Landing Page',
      target_gap: 'Has Phone BUT Missing Website',
      addressable: gaps['Has Phone BUT Missing Website'].count,
      pitch: '48-hour landing page with intake form + instant notifications',
      pricing: '$500-750 setup + $200/mo',
      ease_of_delivery: 'MEDIUM (template + customization)',
      time_to_value: '2 days',
      stickiness: 'MEDIUM (one-time build)',
      severity: 'MEDIUM'
    },
    {
      name: 'Reputation Recovery',
      target_gap: 'Low Rating (<4.0) + High Review Count',
      addressable: gaps['Low Rating (<4.0) + High Review Count'].count,
      pitch: 'Fix negative reviews: response templates + get more positive reviews to dilute bad ones',
      pricing: '$1,000 setup + $400/mo',
      ease_of_delivery: 'HARD (requires manual review responses + strategy)',
      time_to_value: '30 days',
      stickiness: 'HIGH (crisis = urgent)',
      severity: 'CRITICAL'
    },
    {
      name: 'GMB Optimization + Booking Widget',
      target_gap: 'Has Website BUT Low Reviews',
      addressable: gaps['Has Website BUT Low Reviews'].count,
      pitch: 'Optimize Google Business Profile + add booking widget → increase visibility & conversions',
      pricing: '$300 setup + $150/mo',
      ease_of_delivery: 'EASY (mostly config)',
      time_to_value: '1 day',
      stickiness: 'LOW (one-time setup)',
      severity: 'MEDIUM'
    }
  ];
  
  offerings
    .sort((a, b) => {
      // Sort by: addressable × severity × ease
      const scoreA = a.addressable * (a.severity === 'CRITICAL' ? 3 : a.severity === 'HIGH' ? 2 : 1) * (a.ease_of_delivery === 'EASY' ? 2 : 1);
      const scoreB = b.addressable * (b.severity === 'CRITICAL' ? 3 : b.severity === 'HIGH' ? 2 : 1) * (b.ease_of_delivery === 'EASY' ? 2 : 1);
      return scoreB - scoreA;
    })
    .forEach((offer, idx) => {
      console.log(`${idx + 1}. ${offer.name}`);
      console.log(`   Target Gap: ${offer.target_gap}`);
      console.log(`   Addressable: ${offer.addressable} businesses`);
      console.log(`   Pitch: "${offer.pitch}"`);
      console.log(`   Pricing: ${offer.pricing}`);
      console.log(`   Ease: ${offer.ease_of_delivery} | Time to Value: ${offer.time_to_value} | Stickiness: ${offer.stickiness}`);
      console.log(`   Severity: ${offer.severity}`);
      console.log('');
    });
  
  // NICHE-SPECIFIC OPS GAPS
  console.log('\n=== TOP NICHES BY REVIEW-GENERATION OPPORTUNITY ===\n');
  
  const nicheReviewGaps = {};
  filtered.forEach(biz => {
    const niche = biz.primary_category || 'Unknown';
    const hasWebsite = !!biz.website;
    const reviewCount = biz.review_count || 0;
    const rating = biz.rating ? parseFloat(biz.rating) : 0;
    
    if (!nicheReviewGaps[niche]) {
      nicheReviewGaps[niche] = {
        total: 0,
        needsReviews: 0, // <20 reviews but has website
        hasWebsite: 0,
        avgRating: [],
        avgReviews: []
      };
    }
    
    nicheReviewGaps[niche].total++;
    if (hasWebsite) nicheReviewGaps[niche].hasWebsite++;
    if (hasWebsite && reviewCount < 20) nicheReviewGaps[niche].needsReviews++;
    if (rating > 0) nicheReviewGaps[niche].avgRating.push(rating);
    if (reviewCount > 0) nicheReviewGaps[niche].avgReviews.push(reviewCount);
  });
  
  const reviewGapSummary = Object.entries(nicheReviewGaps)
    .filter(([_, data]) => data.total >= 30)
    .map(([niche, data]) => ({
      niche,
      total: data.total,
      needsReviews: data.needsReviews,
      pctNeedsReviews: ((data.needsReviews / data.total) * 100).toFixed(1),
      avgRating: data.avgRating.length ? (data.avgRating.reduce((a,b) => a+b, 0) / data.avgRating.length).toFixed(2) : 'N/A',
      avgReviews: data.avgReviews.length ? Math.round(data.avgReviews.reduce((a,b) => a+b, 0) / data.avgReviews.length) : 0,
      reviewGenScore: Math.round(data.needsReviews * (data.hasWebsite / data.total))
    }))
    .sort((a, b) => b.reviewGenScore - a.reviewGenScore);
  
  console.table(reviewGapSummary.slice(0, 20));
}

analyzeOpsGaps().catch(console.error);
