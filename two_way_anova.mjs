import jStat from "./libs/jstat.min.js"

//standalone implementation of anova

//helpers
Array.prototype.sum=function(){return this.reduce((p,c)=>(p+c),0)};//number
Array.prototype.mean=function(){return this.length?this.sum()/this.length:0};//number
Array.prototype.stddev=function(){
  let n = this.length;//number
  if(n<2) return 0;//number
  let m = this.mean();//number
  let square_diffs = this.map(x=>Math.pow(x-m,2));//array
  let ss = square_diffs.sum();//number
  return Math.sqrt(ss/(n-1));//number
};
function assert(condition,msg){
  if(!condition) throw(`Required: ${msg}`);
}

//funció auxiliar per generar combinacions
function genera_combinacions(arr){
  if(!arr)          throw("not an array");
  if(arr.length==0) throw("array length is 0");
  if(arr.length==1) throw("array length is 1");
  if(arr.length==2) return [arr];
  let combinacions=[];
  let e0=arr[0];
  for(let i=1;i<arr.length;i++){
    let ei=arr[i];
    combinacions.push([e0,ei]);
  }
  let nou_arr = arr.slice(1);
  return [...combinacions,...genera_combinacions(nou_arr)];
}
(function(){ //test
  return;
  console.log(genera_combinacions(['a','b','c','d','e']));
  process.exit()
})();

/* two way ANOVA */
export function two_way_anova(table){
  //make sure table has correct properties
  assert(table.constructor===Array,"table is an array");
  assert(table.length,"table has rows");
  assert(table.every(row=>row.factors && row.observations),"every row has .factors and .observations");
  assert(table.every(row=>row.factors.constructor===Object),"every row .factors is an Object");
  assert(table.every(row=>Object.keys(row.factors).length==2),"every row has two factors");
  assert(table.every(row=>row.observations.constructor===Array),"every row .observations is an Array");
  assert(table.every(row=>row.observations.length),"every row has observations");

  //total number of observations
  let N = table.map(g=>g.observations.length).sum();

  //mean of each row
  let means_within_each_group = table.map(group=>group.observations.mean());

  //total mean among all observations
  let grand_mean = means_within_each_group.mean();

  //sum of squares of all observations respect the grand mean
  let SST = table.map(g=>g.observations.map(n=>Math.pow(n-grand_mean,2)).sum()).sum();

  //sum of squares within groups
  let SSE = table.map((group,i)=>{
    let mean = means_within_each_group[i];
    return group.observations.map(n=>Math.pow(n-mean,2)).sum();
  }).sum();

  //get factors: "type" and "temperature" in the example
  //create a set of all posible values for each factor
  let factors={};
  table.forEach(group=>{
    Object.entries(group.factors).forEach(([key,val])=>{
      if(!factors[key]){
        factors[key]=new Set();
      }
      factors[key].add(val);
    });
  });

  Object.entries(factors).forEach(([factor,set])=>{
    assert(set.size>1,`factor "${factor}" must have more than 1 value`);
  });

  //mean for each value of each factor
  let means_within_factor_values={};
  Object.entries(factors).forEach(([factor,set])=>{
    means_within_factor_values[factor]={};
    Array.from(set).forEach(value=>{
      let grups = table.filter(g=>g.factors[factor]==value);
      let observations = grups.map(gr=>gr.observations).reduce((p,c)=>[...p,...c],[])
      let mean = observations.mean();
      means_within_factor_values[factor][value] = mean;
    });
  });

  //SSB for each factor
  let SSB={};
  Object.entries(factors).forEach(([factor,set],i)=>{
    //number of observations per group
    let n = table.map(g=>g.observations.length).mean();

    //number of levels OF THE OTHER FACTOR
    let b = Object.values(factors)[[1,0][i]].size;

    let means = Object.values(means_within_factor_values[factor]);

    //sum of squares for this factor
    let gm = grand_mean;
    let ssb = n*b*means.map(m=>(m-gm)*(m-gm)).sum();

    //save it
    SSB[factor]=ssb;
  });

  //SSI: sum of squares of interactions between factors
  let SSI = table.map(group=>{
    //number of observations
    let n = group.observations.length;

    //mean of this group
    let mean = group.observations.mean();

    //means for each factor of this group
    let means = Object.entries(group.factors).map(([fname,fval])=>{
      return means_within_factor_values[fname][fval];
    });

    //final term of the global SSI sum for this group
    let term = n*Math.pow(mean-means.sum()+grand_mean,2);

    return term;
  }).sum();

  //calculate all degrees of freedom: number of levels - 1
  let degrees_of_freedom={factors:{},interaction:1,error:-1};
  Object.entries(factors).forEach(([factor,set])=>{
    let df = set.size - 1;
    degrees_of_freedom.factors[factor]  = df;
    degrees_of_freedom.interaction     *= df;
    degrees_of_freedom.error           *= (df+1);
  });
  degrees_of_freedom.error += N;

  //calculate all Mean square errors
  let MS={factors:{},interaction:null,error:null};
  Object.entries(factors).forEach(([factor,set])=>{
    let df = degrees_of_freedom.factors[factor];
    MS.factors[factor] = SSB[factor]/df;
  });
  MS.interaction = SSI/degrees_of_freedom.interaction;
  MS.error       = SSE/degrees_of_freedom.error;

  //confidence interval for each factor value
  //using MSE as an estimate of variance
  //and applying the standard confidence
  //interval procedure for the mean of a normal distribution with unknown variance.
  let ci_within_factor_values={};
  Object.entries(factors).forEach(([factor,set])=>{
    ci_within_factor_values[factor]={};
    Array.from(set).forEach(value=>{
      let grups = table.filter(g=>g.factors[factor]==value);
      let observations = grups.map(gr=>gr.observations).reduce((p,c)=>[...p,...c],[])

      let ci = confidence_interval(
        observations, //array of numbers
        false,        //alpha (0.05 default)
        Math.sqrt(MS.error), //estimate of stddev TODO
      );

      ci_within_factor_values[factor][value] = ci;
    });
  });

  //calculate all F-ratios
  let F_ratio={factors:{},interaction:null};
  Object.entries(factors).forEach(([factor,set])=>{
    F_ratio.factors[factor] = MS.factors[factor]/MS.error;
  });
  F_ratio.interaction = MS.interaction/MS.error;

  let p_value={factors:{},interaction:null};
  Object.entries(factors).forEach(([factor,set])=>{
    let F0  = F_ratio.factors[factor];
    let df1 = degrees_of_freedom.factors[factor];
    let df2 = degrees_of_freedom.error;
    let p   = 1-jStat.centralF.cdf(F0, df1, df2);
    p_value.factors[factor] = p;
  });
  p_value.interaction = 1-jStat.centralF.cdf(
    F_ratio.interaction,            //F0
    degrees_of_freedom.interaction, //df1
    degrees_of_freedom.error,       //df2
  );

  //pack all results
  let results={
    N,
    means_within_each_group, grand_mean,
    SST, SSE, factors,
    means_within_factor_values,
    ci_within_factor_values,
    SSB, SSI,
    degrees_of_freedom,
    MS, F_ratio, p_value,
  };
  return results;
}
(function(){ //test
  return
  //toy data for example from
  //https://www.youtube.com/watch?v=V_fKD1jqHyk&ab_channel=TileStats
  two_way_anova([
    {factors:{plant_type:"low" ,temperature:"cold"}, observations:[3, 4, 6, 7]},
    {factors:{plant_type:"high",temperature:"cold"}, observations:[3, 4, 6, 7]},
    {factors:{plant_type:"low" ,temperature:"warm"}, observations:[ 8, 9,11,12]},
    {factors:{plant_type:"high",temperature:"warm"}, observations:[11,12,14,15]},
    {factors:{plant_type:"low" ,temperature:"hot"},  observations:[4,  5, 6,  9]},
    {factors:{plant_type:"high",temperature:"hot"},  observations:[14,15,16, 19]},
  ]);
})();
(function(){ //test
  //toy data from montgomery SPC table 13.1 "adhesion force data" (page 572)
  let r = two_way_anova([
    {factors:{primer_type:1, appl_method:"dipping" }, observations:[4.0,4.5,4.3]},
    {factors:{primer_type:1, appl_method:"spraying"}, observations:[5.4,4.9,5.6]},
    {factors:{primer_type:2, appl_method:"dipping" }, observations:[5.6,4.9,5.4]},
    {factors:{primer_type:2, appl_method:"spraying"}, observations:[5.8,6.1,6.3]},
    {factors:{primer_type:3, appl_method:"dipping" }, observations:[3.8,3.7,4.0]},
    {factors:{primer_type:3, appl_method:"spraying"}, observations:[5.5,5.0,5.0]},
  ]);
  console.log(r);
  process.exit();
})();

//confidence interval for the mean, std unknown
function confidence_interval(arr, alpha, std_estimate){
  //arr         (mandatory): array of numbers
  //alpha        (optional): number (default is 0.05)
  //std_estimate (optional): if provided, replaces calculation of stddev
  if(!arr || arr.length==0) throw("Array of numbers required");

  //optional arguments defaults
  alpha        = alpha        || 0.05
  std_estimate = std_estimate || false;

  let conf = 1-alpha/2; //number: 0.975, if alpha==0.05
  let n  = arr.length; //number of elements
  let m  = arr.mean(); //mean
  let s  = std_estimate || arr.stddev(); //std dev
  let df = n-1; //degrees of freedom
  let t  = jStat.studentt.inv(conf,df); //tends to 1.96 at n==Infinity (equivalent to Z_(α,0.025))
  let sqrtn = Math.sqrt(n);
  let ci = [m - t*s/sqrtn, m + t*s/sqrtn];
  //console.log({conf,n,m,s,df,t,ci});
  return ci;
}
(function(){ //test
  return
  //montgomery SPC book example 4.3 page 123-124
  //ci:[3145.6, 3275.9]
  console.log(
    confidence_interval([
      3193,
      3124,
      3153,
      3145,
      3093,
      3466,
      3355,
      2979,
      3182,
      3227,
      3256,
      3332,
      3204,
      3282,
      3170,
    ])
  );
})();
