import { powerLevelByKeyword } from 'app/search/d2-known-values';
import './powercaps.scss';

export function PowerCaps({ powercap, label }: { powercap: string; label: string }) {
  return (
    <div className="powercaps">
      <div className="powercap">
        <span className={`powercap-value ${powercap}`}>{powerLevelByKeyword[powercap]}</span>
        <span className="powercap-label">{label}</span>
      </div>
    </div>
  );
}
