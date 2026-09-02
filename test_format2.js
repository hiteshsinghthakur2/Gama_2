const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  });
const str = formatter.format(113625.00);
for (let i = 0; i < str.length; i++) {
  console.log(str[i], str.charCodeAt(i));
}
