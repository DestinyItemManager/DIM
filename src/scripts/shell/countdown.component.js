/**
 * A really simple countdown timer.
 */
function CountdownController($interval, $translate) {
  'ngInject';

  const vm = this;

  vm.endTime = new Date(vm.endTime);

  function update() {
    const diff = vm.endTime.getTime() - Date.now();
    vm.text = dhms(diff / 1000);
    if (diff <= 0) {
      $interval.cancel(vm.timer);
    }
  }

  function pad(n, width) {
    n = String(n);
    return n.length >= width ? n : new Array(width - n.length + 1).join('0') + n;
  }

  function dhms(secs) {
    secs = Math.max(0, secs);

    const days = Math.floor(secs / 86400);
    secs -= days * 86400;
    const hours = Math.floor(secs / 3600) % 24;
    secs -= hours * 3600;
    const minutes = Math.floor(secs / 60) % 60;

    let text = `${hours}:${pad(minutes, 2)}`;
    if (days > 0) {
      text = $translate.instant('Countdown.Days', { numDays: days }) + ' ' + text;
    }
    return text;
  }

  // Update once a minute
  vm.timer = $interval(update, 60000);
  update();

  vm.$onDestroy = function() {
    $interval.cancel(vm.timer);
  };
}

export const CountdownComponent = {
  bindings: {
    endTime: '<'
  },
  controller: CountdownController,
  template: '{{$ctrl.text}}'
};
