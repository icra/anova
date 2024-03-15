//funció per generar combinacions de 2,3,...n elements

//fes combinacions de N elements
function genera_combinacions_N(N,arr){
  if(!arr )         return [];
  if(!arr.length)   return [];
  if(!N)            return [];
  if(N>arr.length)  throw("N > arr.length");
  if(arr.length==N) return [arr];

  //nombre d'elements per combinació

  //conjunts de N elements
  let combinacions=[];

  //elements inicials combinació
  let els = [];
  for(let i=0;i<N-1;i++){
    let e0 = arr[i];
    els.push(e0);
  }

  //itera la resta
  for(let i=N-1;i<arr.length;i++){
    let elsi = [...els];
    let ei = arr[i];
    elsi.push(ei);
    combinacions.push(elsi);
  }

  //treu el primer element perquè ja s'ha combinat amb tothom
  let nou_arr = arr.slice(1);

  return [...combinacions,...genera_combinacions_N(N,nou_arr)];
}

//genera totes les combinacions de N==2 fins a N==N
function genera_combinacions(arr){
  let cs = [];
  for(let N=2;N<=arr.length;N++){
    cs = [...cs, ...genera_combinacions_N(N,arr)];
  }
  return cs;
}

(function(){//test
  /*
  return
  */
  //console.log(genera_combinacions_N(2,['a','b','c','d','e']));
  //console.log(genera_combinacions_N(3,['a','b','c','d','e']));
  //console.log(genera_combinacions_N(4,['a','b','c','d','e']));
  //console.log(genera_combinacions_N(5,['a','b','c','d','e']));
  console.log(genera_combinacions(['a','b','c','d','e','f']));
  /*
    [
      [ 'a', 'b' ],
      [ 'a', 'c' ],
      [ 'a', 'd' ],
      [ 'a', 'e' ],
      [ 'b', 'c' ],
      [ 'b', 'd' ],
      [ 'b', 'e' ],
      [ 'c', 'd' ],
      [ 'c', 'e' ],
      [ 'd', 'e' ],
      [ 'a', 'b', 'c' ],
      [ 'a', 'b', 'd' ],
      [ 'a', 'b', 'e' ],
      [ 'b', 'c', 'd' ],
      [ 'b', 'c', 'e' ],
      [ 'c', 'd', 'e' ],
      [ 'a', 'b', 'c', 'd' ],
      [ 'a', 'b', 'c', 'e' ],
      [ 'b', 'c', 'd', 'e' ],
      [ 'a', 'b', 'c', 'd', 'e' ]
    ]
  */
})();
