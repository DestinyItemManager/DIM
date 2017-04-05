// Function to download data to a file
function download(data, filename, type) {
  var a = document.createElement("a");
  var file = new Blob([data], { type: type });
  var url = URL.createObjectURL(file);
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(function() {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 0);
}

document.getElementById('download-button').addEventListener('click', function(e) {
  download(localStorage.getItem('DIM'), 'dim-data.json', 'application/json');
});
