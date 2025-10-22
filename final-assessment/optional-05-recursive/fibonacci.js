function fibonacci(n) {
  if (n === 0) {
    return 0;
  }
  if (n === 1) {
    return [0, 1];
  }
  
  //Penerapan rekursif
  const seq = fibonacci(n - 1);
  const nextValue = seq[seq.length - 1] + seq[seq.length - 2];
  return [...seq, nextValue];
}

// Jangan hapus kode di bawah ini!
export default fibonacci;
