fetch("/data/products.json")
  .then(res => res.json())
  .then(produtos => {
    console.log(produtos);
  });