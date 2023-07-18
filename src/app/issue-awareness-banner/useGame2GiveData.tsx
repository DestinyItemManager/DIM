import { refresh$ } from 'app/shell/refresh-events';
import { useEventBusListener } from 'app/utils/hooks';
import { useCallback, useEffect, useMemo, useState } from 'react';

interface Game2GiveJSONResponse {
  fundraisingGoal: number;
  sumDonations: number;
  streamIsLive: boolean;
  streamIsEnabled: boolean;
  streamingChannel: string;
}

export default function useGame2GiveData() {
  const [fundraisingState, setFundraisingState] = useState({
    goal: 0,
    donations: 0,
    streamIsLive: false,
    streamIsEnabled: false,
    streamingChannel: '',
  });
  const [syncLoaded, setSyncLoaded] = useState(false);
  const [syncError, setSyncError] = useState(false);
  const result = useMemo(
    () => ({
      ...fundraisingState,
      loaded: syncLoaded,
      error: syncError,
    }),
    [fundraisingState, syncLoaded, syncError]
  );

  const getData = useCallback(async () => {
    try {
      const response = await fetch(
        `https://bungiefoundation.donordrive.com/api/1.3/participants/19805`
      );

      // If there is an error communicating with the Game2Giver server, error gracefully.
      if (!response.ok) {
        setSyncError(true);
        return;
      }

      const json: Game2GiveJSONResponse = await response.json();

      // If there is unexpected data with the Game2Give response, error gracefully.
      if (!json) {
        setSyncError(true);
        return;
      }

      // If the request is successful, capture data and reset the error and loading state.
      setFundraisingState({
        goal: json.fundraisingGoal,
        donations: json.sumDonations,
        streamIsLive: json.streamIsLive,
        streamIsEnabled: json.streamIsEnabled,
        streamingChannel: json.streamingChannel,
      });
      setSyncLoaded(true);
      setSyncError(false);
    } catch {
      setSyncError(true);
    }
  }, []);

  // Refresh data whenever DIM would refresh the Bungie.net profile
  useEventBusListener(refresh$, getData);

  useEffect(() => {
    getData();
  }, [getData]);

  return result;
}
