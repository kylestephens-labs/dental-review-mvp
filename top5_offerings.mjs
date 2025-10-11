import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aeznfrekdipwhhpntvue.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function findTop5Offerings() {
  const targetCities = ['Berkeley', 'Concord', 'Fremont', 'Oakland', 'Pleasanton', 'Walnut Creek'];
  
  console.log('=== TOP 5 OFFERINGS FOR 90-DAY $5K MRR SPRINT ===\n');
  console.log('Criteria: High Volume + Clear Ops Gap + Easy/Medium Delivery\n');
  
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
  
  console.log(`Analyzing ${filtered.length} businesses...\n`);
  
  // Calculate multiple ops gaps per business
  const businessAnalysis = filtered.map(biz => {
    const hasWebsite = !!biz.website;
    const hasPhone = !!biz.phone;
    const rating = biz.rating ? parseFloat(biz.rating) : 0;
    const reviewCount = biz.review_count || 0;
    const niche = biz.primary_category || 'Unknown';
    
    return {
      ...biz,
      niche,
      hasWebsite,
      hasPhone,
      rating,
      reviewCount,
      
      // OPS GAP FLAGS
      needsReviews: hasWebsite && reviewCount < 20, // Have web but invisible
      needsWebsite: !hasWebsite && hasPhone, // Classic lead gen
      needsReputationFix: rating > 0 && rating < 4.0 && reviewCount >= 20, // Crisis
      needsGMBOptimization: hasWebsite && reviewCount === 0, // Has web but zero visibility
      needsBookingSystem: hasWebsite && reviewCount >= 20, // Established, needs automation
      isHighValue: rating >= 4.5 && reviewCount >= 50, // Premium, can upsell
      isNew: reviewCount === 0, // New business needs everything
      
      // REACHABILITY
      reachable: hasPhone || hasWebsite
    };
  });
  
  // GROUP BY NICHE for volume analysis
  const nicheGroups = {};
  businessAnalysis.forEach(biz => {
    if (!nicheGroups[biz.niche]) {
      nicheGroups[biz.niche] = {
        total: 0,
        needsReviews: 0,
        needsWebsite: 0,
        needsReputationFix: 0,
        needsGMBOptimization: 0,
        needsBookingSystem: 0,
        isHighValue: 0,
        reachable: 0
      };
    }
    
    nicheGroups[biz.niche].total++;
    if (biz.needsReviews) nicheGroups[biz.niche].needsReviews++;
    if (biz.needsWebsite) nicheGroups[biz.niche].needsWebsite++;
    if (biz.needsReputationFix) nicheGroups[biz.niche].needsReputationFix++;
    if (biz.needsGMBOptimization) nicheGroups[biz.niche].needsGMBOptimization++;
    if (biz.needsBookingSystem) nicheGroups[biz.niche].needsBookingSystem++;
    if (biz.isHighValue) nicheGroups[biz.niche].isHighValue++;
    if (biz.reachable) nicheGroups[biz.niche].reachable++;
  });
  
  // DEFINE OFFERINGS with detailed scoring
  const offerings = [
    {
      id: 1,
      name: 'Review Generation System',
      description: 'Automated SMS/email after service → 10x reviews in 90 days',
      target_businesses: businessAnalysis.filter(b => b.needsReviews),
      pricing: '$200-400/mo',
      setup_fee: '$0',
      avg_mrr: 300,
      delivery_complexity: 'EASY',
      delivery_time_hrs: 2,
      tech_stack: 'n8n + Twilio/SES',
      time_to_value_days: 7,
      stickiness: 'HIGH',
      churn_risk: 'LOW',
      ops_time_per_client_monthly: 0.5, // hours
      upsell_path: 'Review Response Management ($400/mo)',
      key_niches: ['dentist', 'personal trainer', 'martial arts school', 'gym', 'plumber']
    },
    {
      id: 2,
      name: 'Lead Gen Landing Page',
      description: '48hr custom landing page + intake form + instant notifications',
      target_businesses: businessAnalysis.filter(b => b.needsWebsite),
      pricing: '$200-300/mo',
      setup_fee: '$500-750',
      avg_mrr: 250,
      delivery_complexity: 'MEDIUM',
      delivery_time_hrs: 8,
      tech_stack: 'Next.js template + Supabase + n8n',
      time_to_value_days: 2,
      stickiness: 'MEDIUM',
      churn_risk: 'MEDIUM',
      ops_time_per_client_monthly: 1, // hours
      upsell_path: 'SEO + Review Gen ($500/mo total)',
      key_niches: ['dentist', 'dry cleaner', 'landscaper', 'electrician']
    },
    {
      id: 3,
      name: 'GMB Optimization + Review Kickstart',
      description: 'Fix Google Business Profile + get first 20 reviews fast',
      target_businesses: businessAnalysis.filter(b => b.needsGMBOptimization),
      pricing: '$150-250/mo',
      setup_fee: '$300',
      avg_mrr: 200,
      delivery_complexity: 'EASY',
      delivery_time_hrs: 3,
      tech_stack: 'Manual GMB edits + n8n review automation',
      time_to_value_days: 3,
      stickiness: 'MEDIUM',
      churn_risk: 'MEDIUM',
      ops_time_per_client_monthly: 0.75,
      upsell_path: 'Full Review Gen ($350/mo)',
      key_niches: ['pediatric dentist', 'orthodontist', 'fitness center']
    },
    {
      id: 4,
      name: 'Missed Call Text-Back Service',
      description: 'Auto-text when call goes to voicemail: "Sorry we missed you! Book here: [link]"',
      target_businesses: businessAnalysis.filter(b => b.hasPhone && b.hasWebsite),
      pricing: '$150-300/mo',
      setup_fee: '$200',
      avg_mrr: 225,
      delivery_complexity: 'EASY',
      delivery_time_hrs: 3,
      tech_stack: 'Twilio call forwarding + n8n webhook',
      time_to_value_days: 1,
      stickiness: 'HIGH',
      churn_risk: 'LOW',
      ops_time_per_client_monthly: 0.25,
      upsell_path: 'Full booking system ($400/mo)',
      key_niches: ['plumber', 'hvac contractor', 'electrician', 'roofer', 'dentist']
    },
    {
      id: 5,
      name: 'Reputation Recovery Package',
      description: 'Fix bad reviews: response templates + push for new positive reviews',
      target_businesses: businessAnalysis.filter(b => b.needsReputationFix),
      pricing: '$400-600/mo',
      setup_fee: '$1000',
      avg_mrr: 500,
      delivery_complexity: 'MEDIUM',
      delivery_time_hrs: 10,
      tech_stack: 'Manual review responses + n8n review gen',
      time_to_value_days: 30,
      stickiness: 'HIGH',
      churn_risk: 'LOW',
      ops_time_per_client_monthly: 3,
      upsell_path: 'Ongoing reputation management ($600/mo)',
      key_niches: ['dentist', 'auto repair shop', 'dry cleaner']
    },
    {
      id: 6,
      name: 'Online Booking Widget (Calendly Clone)',
      description: 'Embed booking calendar on existing site → reduce phone tag',
      target_businesses: businessAnalysis.filter(b => b.needsBookingSystem),
      pricing: '$100-200/mo',
      setup_fee: '$200',
      avg_mrr: 150,
      delivery_complexity: 'EASY',
      delivery_time_hrs: 2,
      tech_stack: 'Cal.com embed + n8n notifications',
      time_to_value_days: 1,
      stickiness: 'MEDIUM',
      churn_risk: 'MEDIUM',
      ops_time_per_client_monthly: 0.5,
      upsell_path: 'Full CRM ($350/mo)',
      key_niches: ['dentist', 'personal trainer', 'yoga studio', 'salon']
    }
  ];
  
  // SCORE EACH OFFERING
  offerings.forEach(offer => {
    const volume = offer.target_businesses.length;
    const easeFactor = offer.delivery_complexity === 'EASY' ? 2 : 1;
    const stickinessFactor = offer.stickiness === 'HIGH' ? 1.5 : 1;
    const mrrFactor = offer.avg_mrr / 100;
    
    // 90-Day Revenue Potential Score
    // Formula: (volume × ease × mrr × stickiness) / delivery_time
    offer.score_90day = Math.round(
      (volume * easeFactor * mrrFactor * stickinessFactor) / (offer.delivery_time_hrs / 2)
    );
    
    // Expected closes in 90 days (conservative: 3% of addressable)
    offer.expected_closes_90d = Math.round(volume * 0.03);
    
    // Expected MRR in 90 days
    offer.expected_mrr_90d = offer.expected_closes_90d * offer.avg_mrr;
    
    // Total revenue (setup + 3 months MRR)
    offer.total_revenue_90d = offer.expected_closes_90d * (
      (typeof offer.setup_fee === 'string' ? 625 : offer.setup_fee) + 
      (offer.avg_mrr * 3)
    );
    
    // Ops burden (hours per month × closes)
    offer.ops_burden_monthly = offer.ops_time_per_client_monthly * offer.expected_closes_90d;
  });
  
  // SORT by 90-day score
  offerings.sort((a, b) => b.score_90day - a.score_90day);
  
  console.log('=== TOP 6 OFFERINGS RANKED ===\n');
  
  offerings.forEach((offer, idx) => {
    console.log(`${idx + 1}. ${offer.name}`);
    console.log(`   ${offer.description}`);
    console.log(`   📊 Volume: ${offer.target_businesses.length} businesses`);
    console.log(`   💰 Pricing: ${offer.setup_fee} setup + ${offer.pricing} recurring`);
    console.log(`   ⚙️  Delivery: ${offer.delivery_complexity} (${offer.delivery_time_hrs} hrs/client)`);
    console.log(`   ⏱️  Time to Value: ${offer.time_to_value_days} days`);
    console.log(`   🔒 Stickiness: ${offer.stickiness} | Churn: ${offer.churn_risk}`);
    console.log(`   📈 90-Day Projection:`);
    console.log(`      - Expected Closes: ${offer.expected_closes_90d} (3% of addressable)`);
    console.log(`      - Expected MRR: $${offer.expected_mrr_90d.toLocaleString()}`);
    console.log(`      - Total Revenue: $${offer.total_revenue_90d.toLocaleString()} (setup + 3mo MRR)`);
    console.log(`      - Ops Burden: ${offer.ops_burden_monthly.toFixed(1)} hrs/month`);
    console.log(`   🎯 Top Niches: ${offer.key_niches.slice(0, 3).join(', ')}`);
    console.log(`   🚀 Upsell: ${offer.upsell_path}`);
    console.log(`   🏆 90-Day Score: ${offer.score_90day}`);
    console.log('');
  });
  
  // NICHE BREAKDOWN FOR TOP 3 OFFERINGS
  console.log('\n=== NICHE BREAKDOWN FOR TOP 3 OFFERINGS ===\n');
  
  offerings.slice(0, 3).forEach(offer => {
    console.log(`\n${offer.name} - Top 10 Niches by Volume:\n`);
    
    const nicheBreakdown = {};
    offer.target_businesses.forEach(b => {
      if (!nicheBreakdown[b.niche]) {
        nicheBreakdown[b.niche] = { count: 0, avgRating: [], avgReviews: [] };
      }
      nicheBreakdown[b.niche].count++;
      if (b.rating > 0) nicheBreakdown[b.niche].avgRating.push(b.rating);
      if (b.reviewCount > 0) nicheBreakdown[b.niche].avgReviews.push(b.reviewCount);
    });
    
    const nicheTable = Object.entries(nicheBreakdown)
      .filter(([_, data]) => data.count >= 10)
      .map(([niche, data]) => ({
        niche,
        count: data.count,
        avgRating: data.avgRating.length ? (data.avgRating.reduce((a,b) => a+b, 0) / data.avgRating.length).toFixed(2) : 'N/A',
        avgReviews: data.avgReviews.length ? Math.round(data.avgReviews.reduce((a,b) => a+b, 0) / data.avgReviews.length) : 0,
        projectedMRR: Math.round(data.count * 0.03 * offer.avg_mrr)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    console.table(nicheTable);
  });
  
  // HYPER-NICHE RECOMMENDATIONS
  console.log('\n=== HYPER-NICHE "LAND AND EXPAND" STRATEGY ===\n');
  
  const hyperNicheStrategy = [
    {
      week: 'Week 1-2',
      offering: offerings[0].name,
      niche: 'Dentist',
      volume: businessAnalysis.filter(b => b.niche === 'dentist' && b.needsReviews).length,
      why: 'Largest addressable, highest urgency, you have template'
    },
    {
      week: 'Week 3-4',
      offering: offerings[0].name,
      niche: 'Personal Trainer + Martial Arts',
      volume: businessAnalysis.filter(b => ['personal trainer', 'martial arts school'].includes(b.niche) && b.needsReviews).length,
      why: 'Similar to dentist, high stickiness, proven template works'
    },
    {
      week: 'Week 5-6',
      offering: offerings[0].name,
      niche: 'Plumber + HVAC',
      volume: businessAnalysis.filter(b => ['plumber', 'hvac contractor'].includes(b.niche) && b.needsReviews).length,
      why: 'Home services cluster, emergency business = high value'
    },
    {
      week: 'Week 7-8',
      offering: offerings[3].name,
      niche: 'Same plumber/HVAC clients',
      volume: businessAnalysis.filter(b => ['plumber', 'hvac contractor'].includes(b.niche) && b.hasPhone).length,
      why: 'Upsell existing clients: add missed-call text-back'
    },
    {
      week: 'Week 9-12',
      offering: 'Expand to all top niches',
      niche: 'Dentist, Trainer, Plumber, HVAC, Electrician',
      volume: 'Scale to 20-30 total clients',
      why: 'Replicate proven playbook, optimize for $5k+ MRR'
    }
  ];
  
  console.table(hyperNicheStrategy);
}

findTop5Offerings().catch(console.error);
