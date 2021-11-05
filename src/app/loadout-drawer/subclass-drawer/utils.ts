import _ from 'lodash';
import { SocketWithOptions } from './types';

export function findFirstEmptySocketMod(socketWithOptionsList: SocketWithOptions[]) {
  const emptySockets = _.compact(
    socketWithOptionsList.map(({ socket, options }) =>
      options.find((option) => option.hash === socket.socketDefinition.singleInitialItemHash)
    )
  );
  return emptySockets.length ? emptySockets[0] : undefined;
}
