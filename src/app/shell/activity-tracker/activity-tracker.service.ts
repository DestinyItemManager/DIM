export class ActivityTrackerService {
  private timestamp: number;

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
    return (Date.now() - this.timestamp) <= timespan;
  }
}
