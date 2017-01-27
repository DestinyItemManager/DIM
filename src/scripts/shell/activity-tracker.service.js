export class ActivityTrackerService {
  constructor() {
    this.track();
  }

  get mostRecentActivity() {
    return this.timestamp;
  }

  track() {
    this.timestamp = Date.now();
  }

  activeWithinTimespan(timespan) {
    console.log(Date.now() - this.timestamp, (Date.now() - this.timestamp) <= timespan);
    return (Date.now() - this.timestamp) <= timespan;
  }
}