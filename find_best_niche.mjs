import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aeznfrekdipwhhpntvue.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function findBestNiche() {
  const targetCities = ['Berkeley', 'Concord', 'Fremont', 'Oakland', 'Pleasanton', 'Walnut Creek'];
  
  console.log('=== FINDING BEST NICHE FOR 90-DAY SPRINT ===\n');
  console.log('Formula: volume × ops_gaps × reachability\n');
  console.log('Where:');
  console.log('  - volume = total businesses in niche');
  console.log('  - ops_gaps = % missing website (proxy for needing help)');
  console.log('  - reachability = % with phone or email\n');
  
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
  
  // Group by niche
  const nicheGroups = {};
  filtered.forEach(biz => {
    const niche = biz.primary_category || 'Unknown';
    
    if (!nicheGroups[niche]) {
      nicheGroups[niche] = {
        total: 0,
        has_website: 0,
        has_phone: 0,
        has_email: 0,
        cities: new Set(),
        avg_rating: [],
        review_counts: []
      };
    }
    
    nicheGroups[niche].total++;
    if (biz.website) nicheGroups[niche].has_website++;
    if (biz.phone) nicheGroups[niche].has_phone++;
    if (biz.email) nicheGroups[niche].has_email++;
    if (biz.city) nicheGroups[niche].cities.add(biz.city);
    if (biz.rating) nicheGroups[niche].avg_rating.push(parseFloat(biz.rating));
    if (biz.review_count) nicheGroups[niche].review_counts.push(parseInt(biz.review_count));
  });
  
  // Calculate scores with NEW formula
  const summary = Object.entries(nicheGroups)
    .filter(([niche, data]) => data.total >= 30) // Min 30 businesses for volume
    .map(([niche, data]) => {
      const pct_missing_website = (1 - (data.has_website / data.total));
      const pct_reachable = Math.max(data.has_phone, data.has_email) / data.total;
      const volume_score = data.total;
      
      // NEW FORMULA: volume × ops_gaps × reachability
      const opportunity_score = Math.round(
        volume_score * pct_missing_website * pct_reachable
      );
      
      return {
        niche,
        total: data.total,
        cities: data.cities.size,
        has_website: data.has_website,
        has_phone: data.has_phone,
        has_email: data.has_email,
        pct_missing_website: (pct_missing_website * 100).toFixed(1),
        pct_reachable: (pct_reachable * 100).toFixed(1),
        missing_website: data.total - data.has_website,
        avg_rating: data.avg_rating.length ? (data.avg_rating.reduce((a,b) => a+b, 0) / data.avg_rating.length).toFixed(2) : 'N/A',
        avg_reviews: data.review_counts.length ? Math.round(data.review_counts.reduce((a,b) => a+b, 0) / data.review_counts.length) : 'N/A',
        opportunity_score
      };
    })
    .sort((a, b) => b.opportunity_score - a.opportunity_score);
  
  console.log('TOP 40 NICHES (volume × ops_gaps × reachability):');
  console.table(summary.slice(0, 40));
  
  // Group related niches into clusters
  const clusters = {
    'Cleaning': ['house cleaning service', 'carpet cleaning service', 'janitorial service', 'cleaning service', 'cleaners', 'dryer vent cleaning service', 'window cleaning service', 'gutter cleaning service', 'upholstery cleaning service', 'air duct cleaning service', 'pool cleaning service'],
    'Home Services': ['plumber', 'hvac contractor', 'electrician', 'roofing contractor', 'contractor', 'general contractor', 'air conditioning contractor', 'heating contractor', 'handyman'],
    'Auto': ['auto repair shop', 'auto body shop', 'auto glass shop', 'car wash', 'oil change service', 'tire shop'],
    'Dental': ['dentist', 'dental clinic', 'pediatric dentist', 'orthodontist', 'endodontist', 'cosmetic dentist'],
    'Fitness': ['gym', 'fitness center', 'personal trainer', 'yoga studio', 'pilates studio', 'martial arts school', 'boxing gym'],
    'Landscaping': ['landscaper', 'landscape designer', 'lawn care service', 'tree service']
  };
  
  console.log('\n\n=== CLUSTER ANALYSIS ===\n');
  
  Object.entries(clusters).forEach(([clusterName, niches]) => {
    const clusterData = summary.filter(s => niches.some(n => s.niche.toLowerCase().includes(n.toLowerCase())));
    
    if (clusterData.length > 0) {
      const totalBiz = clusterData.reduce((sum, s) => sum + s.total, 0);
      const totalMissing = clusterData.reduce((sum, s) => sum + s.missing_website, 0);
      const totalScore = clusterData.reduce((sum, s) => sum + s.opportunity_score, 0);
      const avgReachability = (clusterData.reduce((sum, s) => sum + parseFloat(s.pct_reachable), 0) / clusterData.length).toFixed(1);
      
      console.log(`${clusterName}:`);
      console.log(`  Total businesses: ${totalBiz}`);
      console.log(`  Missing websites: ${totalMissing}`);
      console.log(`  Avg reachability: ${avgReachability}%`);
      console.log(`  Combined opportunity score: ${totalScore}`);
      console.log(`  Niches in cluster: ${clusterData.length}`);
      console.log(`  Top 3 niches:`, clusterData.slice(0, 3).map(s => `${s.niche} (${s.total})`).join(', '));
      console.log('');
    }
  });
  
  // Best single niche recommendation
  console.log('\n=== RECOMMENDATION ===\n');
  const top1 = summary[0];
  console.log(`Best Single Niche: ${top1.niche}`);
  console.log(`  - Volume: ${top1.total} businesses`);
  console.log(`  - Missing websites: ${top1.missing_website} (${top1.pct_missing_website}%)`);
  console.log(`  - Reachable: ${top1.pct_reachable}%`);
  console.log(`  - Opportunity Score: ${top1.opportunity_score}`);
  console.log(`  - Cities: ${top1.cities}`);
  console.log(`  - Avg Rating: ${top1.avg_rating}`);
  console.log(`  - Avg Reviews: ${top1.avg_reviews}`);
}

findBestNiche().catch(console.error);
