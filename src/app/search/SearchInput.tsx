import { searchIcon } from 'app/shell/icons';
import AppIcon from 'app/shell/icons/AppIcon';
import { useIsPhonePortrait } from 'app/shell/selectors';
import { isiOSBrowser } from 'app/utils/browsers';

/**
 * A styled text input without fancy features like autocompletion or de-bouncing.
 */
export function SearchInput({
  onQueryChanged,
  placeholder,
  autoFocus,
  query,
}: {
  onQueryChanged: (newValue: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  query?: string;
}) {
  const isPhonePortrait = useIsPhonePortrait();
  // On iOS at least, focusing the keyboard pushes the content off the screen
  const nativeAutoFocus = !isPhonePortrait && !isiOSBrowser();

  return (
    <div className="search-filter" role="search">
      <AppIcon icon={searchIcon} className="search-bar-icon" />
      <input
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        autoFocus={autoFocus && nativeAutoFocus}
        placeholder={placeholder}
        type="text"
        name="filter"
        value={query}
        onChange={(e) => onQueryChanged(e.currentTarget.value)}
      />
    </div>
  );
}
