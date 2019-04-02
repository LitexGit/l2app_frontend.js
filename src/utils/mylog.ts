export default () => {
  let originalLog = console.log;
  // Overwriting
  console.log = function() {
    let args = [].slice.call(arguments);
    originalLog.apply(console.log, [getCurrentDateString()].concat(args));
  };
  // Returns current timestamp
  function getCurrentDateString() {
    return new Date().toISOString() + ' ------';
  }
};
