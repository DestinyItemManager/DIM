import * as React from 'react';
import { t } from 'i18next';
import './FilterHelp.scss';
import { destinyVersionSelector } from '../accounts/reducer';
import { RootState } from '../store/reducers';
import { connect } from 'react-redux';

const youTubeLink =
  "<a href='https://youtu.be/T0tjH95AG_I' target='_blank' rel='noopener noreferrer'>YouTube</a>";

function mapStateToProps(state: RootState) {
  return {
    destinyVersion: destinyVersionSelector(state)
  };
}

function FilterHelp({ destinyVersion }: { destinyVersion: 1 | 2 }) {
  return (
    <div className="dim-page dim-static-page filter-view">
      <h1>{t('Header.Filters')}</h1>
      <div>
        <p>{t('Filter.Combine', { example: 'is:arc light:>300' })}</p>
        <p>{t('Filter.Negate', { notexample: '-is:engram' })}</p>

        <p dangerouslySetInnerHTML={{ __html: t('Filter.VideoExample', { link: youTubeLink }) }} />
        <table>
          <tbody>
            <tr>
              <td>{t('Filter.Filter')}</td>
              <td>{t('Filter.Description')}</td>
            </tr>
            <tr>
              <td>
                <span>perk</span> <span>&quot;item name&quot;</span> <span>perk:magazine</span>
              </td>
              <td>{t('Filter.PartialMatch')}</td>
            </tr>
            <tr>
              <td>
                <span>is:inleftchar</span> <span>is:inmiddlechar</span> <span>is:inrightchar</span>
                <span>is:invault</span> <span>is:incurrentchar</span>
              </td>
              <td>{t('Filter.Location')}</td>
            </tr>
            <tr>
              <td>
                <span>is:arc</span> <span>is:solar</span> <span>is:void</span>{' '}
                <span>is:kinetic</span> <span>is:heroic</span>
              </td>
              <td>{t('Filter.DamageType')}</td>
            </tr>
            {destinyVersion === 2 && (
              <tr>
                <td>
                  <span>is:primary</span> <span>is:special</span> <span>is:heavy</span>
                </td>
                <td>{t('Filter.AmmoType')}</td>
              </tr>
            )}
            {destinyVersion === 1 && (
              <tr>
                <td>
                  <span>light:value</span> <span>light:&gt;=value</span>{' '}
                  <span>light:&gt;value</span> <span>light:&lt;value</span>{' '}
                  <span>light:&lt;=value</span>
                </td>
                <td>{t('Filter.LightLevel')}</td>
              </tr>
            )}
            {destinyVersion === 2 && (
              <tr>
                <td>
                  <span>power:value</span> <span>power:&gt;=value</span>{' '}
                  <span>power:&gt;value</span> <span>power:&lt;value</span>{' '}
                  <span>power:&lt;=value</span>
                </td>
                <td>{t('Filter.PowerLevel')}</td>
              </tr>
            )}
            <tr>
              <td>
                <span>stack:value</span> <span>stack:&gt;=value</span> <span>stack:&gt;value</span>
                <span>stack:&lt;value</span> <span>stack:&lt;=value</span>
              </td>
              <td>{t('Filter.StackLevel')}</td>
            </tr>
            <tr>
              <td>
                <span>level:value</span> <span>level:&gt;=value</span> <span>level:&gt;value</span>
                <span>level:&lt;value</span> <span>level:&lt;=value</span>
              </td>
              <td>{t('Filter.RequiredLevel')}</td>
            </tr>
            <tr>
              <td>
                <span>stat:impact:value</span> <span>stat:impact:&gt;=value</span>
                <span>stat:impact:&gt;value</span> <span>stat:impact:&lt;value</span>
                <span>stat:impact:&lt;=value</span>
              </td>
              <td>
                <span>{t('Filter.Stats')}</span>
                <ul>
                  {destinyVersion === 2 && <li>stat:rpm:</li>}
                  {destinyVersion === 1 && <li>stat:rof:</li>}
                  <li>stat:charge:</li>
                  <li>stat:impact:</li>
                  <li>stat:range:</li>
                  <li>stat:stability:</li>
                  <li>stat:reload:</li>
                  <li>stat:magazine:</li>
                  <li>stat:aimassist: or stat:aa:</li>
                  <li>stat:equipspeed:</li>
                  {destinyVersion === 2 && <li>stat:mobility:</li>}
                  {destinyVersion === 2 && <li>stat:resilience:</li>}
                  {destinyVersion === 2 && <li>stat:recovery:</li>}
                </ul>
              </td>
            </tr>
            {destinyVersion === 1 && (
              <tr>
                <td>
                  <span>quality:value</span> <span>quality:&gt;=value</span>{' '}
                  <span>quality:&gt;value</span> <span>quality:&lt;value</span>{' '}
                  <span>quality:&lt;=value</span>
                </td>
                <td>{t('Filter.Quality', { percentage: 'percentage', quality: 'quality' })}</td>
              </tr>
            )}
            {destinyVersion === 1 && (
              <tr>
                <td>
                  <span>is:haslight</span>
                </td>
                <td>{t('Filter.ContributeLight')}</td>
              </tr>
            )}

            {destinyVersion === 2 && (
              <tr>
                <td>
                  <span>is:haspower</span>
                </td>
                <td>{t('Filter.ContributePower')}</td>
              </tr>
            )}
            <tr>
              <td>
                <span>is:weapon</span> <span>is:armor</span> <span>is:ghost</span>
                <span>is:vehicle</span> {destinyVersion === 2 && <span>is:ships</span>}
                {destinyVersion === 2 && <span>is:engrams</span>}
                {destinyVersion === 2 && <span>is:consumables</span>}
                {destinyVersion === 2 && <span>is:modifications</span>}
                {destinyVersion === 2 && <span>is:shaders</span>}
                {destinyVersion === 1 && <span>is:cosmetic</span>}
              </td>
              <td>{t('Filter.Categories')}</td>
            </tr>
            <tr>
              <td>
                <span>is:equipment</span> <span>is:equippable</span>
              </td>
              <td>{t('Filter.Equipment')}</td>
            </tr>
            <tr>
              <td>
                <span>is:transferable</span> <span>is:movable</span>
              </td>
              <td>{t('Filter.Transferable')}</td>
            </tr>
            <tr>
              <td>
                <span>is:equipped</span>
              </td>
              <td>{t('Filter.Equipped')}</td>
            </tr>
            <tr>
              <td>
                <span>is:weapon</span> <span>is:class</span>
                {destinyVersion === 1 && <span>is:primary</span>}
                {destinyVersion === 1 && <span>is:special</span>}
                {destinyVersion === 1 && <span>is:heavy</span>}
                {destinyVersion === 2 && <span>is:kinetic</span>}
                {destinyVersion === 2 && <span>is:energy</span>}
                {destinyVersion === 2 && <span>is:power</span>}
              </td>
              <td>{t('Filter.WeaponClass')}</td>
            </tr>
            <tr>
              <td>
                <span>is:armor</span> <span>is:helmet</span> <span>is:gauntlets</span>
                <span>is:chest</span> <span>is:leg</span> <span>is:classitem</span>
              </td>
              <td>{t('Filter.ArmorCategory')}</td>
            </tr>
            <tr>
              <td>
                <span>is:common</span> <span>is:uncommon</span> <span>is:rare</span>
                <span>is:legendary</span> {destinyVersion === 1 && <span>is:sublime</span>}
                <span>is:exotic</span> <span>is:white</span> <span>is:green</span>{' '}
                <span>is:blue</span> <span>is:purple</span> <span>is:yellow</span>
                {destinyVersion === 2 && <span>is:masterwork</span>}
              </td>
              <td>{t('Filter.RarityTier')}</td>
            </tr>

            {destinyVersion === 1 && (
              <tr>
                <td>
                  <span>is:intellect</span> <span>is:discipline</span> <span>is:strength</span>
                </td>
                <td>{t('Filter.NamedStat')}</td>
              </tr>
            )}
            <tr>
              <td>
                <span>is:infusable</span> <span>is:infuse</span>
              </td>
              <td>{t('Filter.Infusable')}</td>
            </tr>

            {destinyVersion === 2 && (
              <tr>
                <td>
                  <span>is:randomroll</span>
                </td>
                <td>{t('Filter.RandomRoll')}</td>
              </tr>
            )}

            {destinyVersion === 1 && (
              <tr>
                <td>
                  <span>is:ascended</span> <span>is:unascended</span>
                </td>
                <td>{t('Filter.Ascended')}</td>
              </tr>
            )}

            {destinyVersion === 1 && (
              <tr>
                <td>
                  <span>is:reforgeable</span> <span>is:reforge</span> <span>is:rerollable</span>
                  <span>is:reroll</span>
                </td>
                <td>{t('Filter.Reforgeable')}</td>
              </tr>
            )}

            {destinyVersion === 1 && (
              <tr>
                <td>
                  <span>is:complete</span> <span>is:incomplete</span>
                  <span>is:xpincomplete, is:needsxp</span> <span>is:xpcomplete</span>
                  <span>is:upgraded</span>
                </td>
                <td>
                  <span>{t('Filter.Leveling.Leveling')}</span>
                  <ul>
                    <li>{t('Filter.Leveling.Complete', { term: 'complete' })}</li>
                    <li>{t('Filter.Leveling.Incomplete', { term: 'incomplete' })}</li>
                    <li>{t('Filter.Leveling.NeedsXP', { term: 'xpincomplete/needsxp' })}</li>
                    <li>{t('Filter.Leveling.XPComplete', { term: 'xpcomplete' })}</li>
                    <li>{t('Filter.Leveling.Upgraded', { term: 'upgraded' })}</li>
                  </ul>
                </td>
              </tr>
            )}
            <tr>
              <td>
                <span>is:titan</span> <span>is:hunter</span> <span>is:warlock</span>
              </td>
              <td>{t('Filter.Class')}</td>
            </tr>
            <tr>
              <td>
                <span>is:dupe</span> <span>is:duplicate</span> <span>is:dupelower</span>
                <span>count:value</span> <span>count:&gt;=value</span> <span>count:&gt;value</span>
                <span>count:&lt;value</span> <span>count:&lt;=value</span>
              </td>
              <td>{t('Filter.Dupe')}</td>
            </tr>
            <tr>
              <td>
                <span>is:locked</span> <span>is:unlocked</span>
              </td>
              <td>{t('Filter.Locked')}</td>
            </tr>

            {destinyVersion === 1 && (
              <tr>
                <td>
                  <span>is:tracked</span> <span>is:untracked</span>
                </td>
                <td>{t('Filter.Tracked')}</td>
              </tr>
            )}
            <tr>
              <td>
                <span>is:stackable</span>
              </td>
              <td>{t('Filter.Stackable')}</td>
            </tr>
            <tr>
              <td>
                <span>is:autorifle</span> <span>is:fusionrifle</span>
                {destinyVersion === 2 && <span>is:grenadelauncher</span>}
                <span>is:handcannon</span> <span>is:machinegun</span> <span>is:pulserifle</span>
                <span>is:scoutrifle</span> <span>is:shotgun</span> <span>is:sidearm</span>
                <span>is:sniperrifle</span> {destinyVersion === 2 && <span>is:submachine</span>}
                {destinyVersion === 2 && <span>is:bow</span>} <span>is:rocketlauncher</span>
                <span>is:sword</span>
              </td>
              <td>{t('Filter.WeaponType')}</td>
            </tr>
            <tr>
              <td>
                <span>is:engram</span>
              </td>
              <td>{t('Filter.Engrams')}</td>
            </tr>

            {destinyVersion === 1 && (
              <tr>
                <td>
                  <span>is:glimmeritem</span> <span>is:glimmerboost</span>{' '}
                  <span>is:glimmersupply</span>
                </td>
                <td>
                  <span>{t('Filter.Glimmer.Glimmer')}</span>
                  <ul>
                    <li>{t('Filter.Glimmer.Any')}</li>
                    <li>{t('Filter.Glimmer.Boost')}</li>
                    <li>{t('Filter.Glimmer.Item')}</li>
                  </ul>
                </td>
              </tr>
            )}
            <tr>
              <td>
                <span>is:new</span>
              </td>
              <td>{t('Filter.NewItems')}</td>
            </tr>
            <tr>
              <td>
                <span>tag:none</span> <span>tag:favorite</span> <span>tag:keep</span>
                <span>tag:junk</span> <span>tag:infuse</span>
              </td>
              <td>
                <ul>
                  <li>{t('Filter.Tags.NoTag')}</li>
                  <li>{t('Filter.Tags.Favorite')}</li>
                  <li>{t('Filter.Tags.Keep')}</li>
                  <li>{t('Filter.Tags.Dismantle')}</li>
                  <li>{t('Filter.Tags.Infuse')}</li>
                </ul>
              </td>
            </tr>
            <tr>
              <td>
                <span>notes:value</span>
              </td>
              <td>{t('Filter.Notes')}</td>
            </tr>

            {$featureFlags.reviewsEnabled && (
              <>
                <tr>
                  <td>
                    <span>is:rated</span>
                  </td>
                  <td>{t('Filter.Rated')}</td>
                </tr>
                <tr>
                  <td>
                    <span>rating:value</span> <span>rating:&gt;=value</span>{' '}
                    <span>rating:&gt;value</span> <span>rating:&lt;value</span>{' '}
                    <span>rating:&lt;=value</span>
                  </td>
                  <td>{t('Filter.Rating')}</td>
                </tr>
                <tr>
                  <td>
                    <span>ratingcount:&gt;=value</span> <span>ratingcount:&gt;value</span>
                    <span>ratingcount:&lt;value</span> <span>ratingcount:&lt;=value</span>
                  </td>
                  <td>{t('Filter.RatingCount')}</td>
                </tr>
              </>
            )}

            <tr>
              <td>
                <span>year:2</span>
              </td>
              <td>{t('Filter.Year')}</td>
            </tr>
            {destinyVersion === 2 && (
              <tr>
                <td>
                  <span>season:4</span>
                </td>
                <td>{t('Filter.Season')}</td>
              </tr>
            )}
            <tr>
              <td>
                <span>is:dawning</span> <span>is:crimsondays</span> <span>is:solstice</span>
                <span>is:fotl</span>
              </td>
              <td>{t('Filter.Event')}</td>
            </tr>
            <tr>
              <td>
                <span>is:inloadout</span> <span>not:inloadout</span>
              </td>
              <td>{t('Filter.InLoadout')}</td>
            </tr>
            {destinyVersion === 1 && (
              <tr>
                <td>
                  <span>is:ornamentable</span> <span>is:ornamentmissing</span>
                  <span>is:ornamentunlocked</span>
                </td>
                <td>{t('Filter.Ornament')}</td>
              </tr>
            )}
            <tr>
              <td>
                <span>is:postmaster</span> <span>is:inpostmaster</span>
              </td>
              <td>{t('Filter.Postmaster')}</td>
            </tr>
            {destinyVersion === 1 && (
              <tr>
                <td>
                  <span>is:fwc</span> <span>is:do</span> <span>is:nm</span> <span>is:speaker</span>
                  <span>is:variks</span> <span>is:shipwright</span> <span>is:osiris</span>
                  <span>is:xur</span> <span>is:shaxx</span> <span>is:cq</span> <span>is:eris</span>
                  <span>is:ev</span> <span>is:gunsmith</span>
                </td>
                <td>
                  <span
                    dangerouslySetInnerHTML={{
                      __html: t('Filter.Vendor', {
                        vendor: t('Filter.Vendors.FWC'),
                        context: 'noname'
                      })
                    }}
                  />
                  <span
                    dangerouslySetInnerHTML={{
                      __html: t('Filter.Vendor', {
                        vendor: t('Filter.Vendors.DO'),
                        context: 'noname'
                      })
                    }}
                  />
                  <span
                    dangerouslySetInnerHTML={{
                      __html: t('Filter.Vendor', {
                        vendor: t('Filter.Vendors.NM'),
                        context: 'noname'
                      })
                    }}
                  />
                  <span
                    dangerouslySetInnerHTML={{
                      __html: t('Filter.Vendor', {
                        vendor: t('Filter.Vendors.Speaker'),
                        context: 'noname'
                      })
                    }}
                  />
                  <span
                    dangerouslySetInnerHTML={{
                      __html: t('Filter.Vendor', { vendor: 'Variks', context: 'noname' })
                    }}
                  />
                  <span
                    dangerouslySetInnerHTML={{
                      __html: t('Filter.Vendor', {
                        vendor: t('Filter.Vendors.Shipwright'),
                        context: 'noname'
                      })
                    }}
                  />
                  <span
                    dangerouslySetInnerHTML={{
                      __html: t('Filter.Vendor', { vendor: 'Osiris', context: 'noname' })
                    }}
                  />
                  <span
                    dangerouslySetInnerHTML={{
                      __html: t('Filter.Vendor', { vendor: 'Xûr', context: 'noname' })
                    }}
                  />
                  <span
                    dangerouslySetInnerHTML={{
                      __html: t('Filter.Vendor', { vendor: 'Shaxx', context: 'noname' })
                    }}
                  />
                  <span
                    dangerouslySetInnerHTML={{
                      __html: t('Filter.Vendor', {
                        vendor: t('Filter.Vendors.CQ'),
                        context: 'noname'
                      })
                    }}
                  />
                  <span
                    dangerouslySetInnerHTML={{
                      __html: t('Filter.Vendor', { vendor: 'Eris Morn', context: 'noname' })
                    }}
                  />
                  <span
                    dangerouslySetInnerHTML={{
                      __html: t('Filter.Vendor', {
                        vendor: t('Filter.Vendors.EV'),
                        context: 'noname'
                      })
                    }}
                  />
                  <span
                    dangerouslySetInnerHTML={{
                      __html: t('Filter.Vendor', {
                        vendor: t('Filter.Vendors.Gunsmith'),
                        context: 'noname'
                      })
                    }}
                  />
                </td>
              </tr>
            )}
            {destinyVersion === 2 && (
              <tr>
                <td>
                  <span>source:fwc</span> <span>source:do</span> <span>source:nm</span>
                  <span>source:eververse</span> <span>source:gunsmith</span>{' '}
                  <span>source:shipwright</span>
                  <span>source:edz</span> <span>source:titan</span> <span>source:nessus</span>
                  <span>source:io</span> <span>source:mercury</span> <span>source:mars</span>
                  <span>source:tangled</span> <span>source:dreaming</span>
                  <span>source:shaxx,source:crucible</span> <span>source:trials</span>
                  <span>source:ironbanner</span> <span>source:nightfall</span>
                  <span>source:zavala,source:strikes</span> <span>source:ikora</span>
                  <span>source:drifter,source:gambit</span> <span>source:ep</span>
                  <span>source:raid</span> <span>source:leviathan</span> <span>source:sos</span>
                  <span>source:eow</span> <span>source:lastwish</span> <span>source:scourge</span>
                  <span>source:prestige</span> <span>source:adventure</span>{' '}
                  <span>source:blackarmory</span>
                </td>
                <td>
                  <span dangerouslySetInnerHTML={{ __html: t('Filter.Source.FWC') }} />
                  <span dangerouslySetInnerHTML={{ __html: t('Filter.Source.DO') }} />
                  <span dangerouslySetInnerHTML={{ __html: t('Filter.Source.NM') }} />
                  <span dangerouslySetInnerHTML={{ __html: t('Filter.Source.EV') }} />
                  <span dangerouslySetInnerHTML={{ __html: t('Filter.Source.Gunsmith') }} />
                  <span dangerouslySetInnerHTML={{ __html: t('Filter.Source.Shipwright') }} />
                  <span dangerouslySetInnerHTML={{ __html: t('Filter.Source.EDZ') }} />
                  <span dangerouslySetInnerHTML={{ __html: t('Filter.Source.Titan') }} />
                  <span dangerouslySetInnerHTML={{ __html: t('Filter.Source.Nessus') }} />
                  <span dangerouslySetInnerHTML={{ __html: t('Filter.Source.Io') }} />
                  <span dangerouslySetInnerHTML={{ __html: t('Filter.Source.Mercury') }} />
                  <span dangerouslySetInnerHTML={{ __html: t('Filter.Source.Mars') }} />
                  <span dangerouslySetInnerHTML={{ __html: t('Filter.Source.Tangled') }} />
                  <span dangerouslySetInnerHTML={{ __html: t('Filter.Source.Dreaming') }} />
                  <span dangerouslySetInnerHTML={{ __html: t('Filter.Source.Crucible') }} />
                  <span dangerouslySetInnerHTML={{ __html: t('Filter.Source.Trials') }} />
                  <span dangerouslySetInnerHTML={{ __html: t('Filter.Source.IronBanner') }} />
                  <span dangerouslySetInnerHTML={{ __html: t('Filter.Source.Nightfall') }} />
                  <span dangerouslySetInnerHTML={{ __html: t('Filter.Source.Zavala') }} />
                  <span dangerouslySetInnerHTML={{ __html: t('Filter.Source.Ikora') }} />
                  <span dangerouslySetInnerHTML={{ __html: t('Filter.Source.Gambit') }} />
                  <span dangerouslySetInnerHTML={{ __html: t('Filter.Source.EP') }} />
                  <span dangerouslySetInnerHTML={{ __html: t('Filter.Source.Raid') }} />
                  <span dangerouslySetInnerHTML={{ __html: t('Filter.Source.Leviathan') }} />
                  <span dangerouslySetInnerHTML={{ __html: t('Filter.Source.SoS') }} />
                  <span dangerouslySetInnerHTML={{ __html: t('Filter.Source.EoW') }} />
                  <span dangerouslySetInnerHTML={{ __html: t('Filter.Source.LastWish') }} />
                  <span dangerouslySetInnerHTML={{ __html: t('Filter.Source.Scourge') }} />
                  <span dangerouslySetInnerHTML={{ __html: t('Filter.Source.Prestige') }} />
                  <span dangerouslySetInnerHTML={{ __html: t('Filter.Source.Adventure') }} />
                  <span dangerouslySetInnerHTML={{ __html: t('Filter.Source.BlackArmory') }} />
                </td>
              </tr>
            )}
            {destinyVersion === 1 && (
              <tr>
                <td>
                  <span>is:vanilla</span> <span>is:qw</span> <span>is:ib</span> <span>is:vog</span>{' '}
                  <span>is:ce</span> <span>is:poe</span> <span>is:trials</span> <span>is:ttk</span>{' '}
                  <span>is:coe</span> <span>is:kf</span> <span>is:srl</span> <span>is:cd</span>{' '}
                  <span>is:roi</span> <span>is:af</span> <span>is:wotm</span>{' '}
                  <span>is:dawning</span> <span>is:aot</span>
                </td>
                <td>
                  <span
                    dangerouslySetInnerHTML={{
                      __html: t('Filter.Release', { release: t('Filter.Releases.Vanilla') })
                    }}
                  />
                  <span
                    dangerouslySetInnerHTML={{
                      __html: t('Filter.Activity', { release: t('Filter.Activities.QW') })
                    }}
                  />
                  <span
                    dangerouslySetInnerHTML={{
                      __html: t('Filter.Activity', { release: t('Filter.Activities.IB') })
                    }}
                  />
                  <span
                    dangerouslySetInnerHTML={{
                      __html: t('Filter.Activity', { release: t('Filter.Activities.VoG') })
                    }}
                  />
                  <span
                    dangerouslySetInnerHTML={{
                      __html: t('Filter.Activity', { release: t('Filter.Activities.CE') })
                    }}
                  />
                  <span
                    dangerouslySetInnerHTML={{
                      __html: t('Filter.Activity', { release: t('Filter.Activities.PoE') })
                    }}
                  />
                  <span
                    dangerouslySetInnerHTML={{
                      __html: t('Filter.Activity', { release: t('Filter.Activities.ToO') })
                    }}
                  />
                  <span
                    dangerouslySetInnerHTML={{
                      __html: t('Filter.Release', { release: t('Filter.Releases.tTK') })
                    }}
                  />
                  <span
                    dangerouslySetInnerHTML={{
                      __html: t('Filter.Activity', { release: t('Filter.Activities.CoE') })
                    }}
                  />
                  <span
                    dangerouslySetInnerHTML={{
                      __html: t('Filter.Activity', { release: t('Filter.Activities.KF') })
                    }}
                  />
                  <span
                    dangerouslySetInnerHTML={{
                      __html: t('Filter.Activity', { release: t('Filter.Activities.SRL') })
                    }}
                  />
                  <span
                    dangerouslySetInnerHTML={{
                      __html: t('Filter.Activity', { release: t('Filter.Activities.CD') })
                    }}
                  />
                  <span
                    dangerouslySetInnerHTML={{
                      __html: t('Filter.Release', { release: t('Filter.Releases.RoI') })
                    }}
                  />
                  <span
                    dangerouslySetInnerHTML={{
                      __html: t('Filter.Activity', { release: t('Filter.Activities.AF') })
                    }}
                  />
                  <span
                    dangerouslySetInnerHTML={{
                      __html: t('Filter.Activity', { release: t('Filter.Activities.WotM') })
                    }}
                  />
                  <span
                    dangerouslySetInnerHTML={{
                      __html: t('Filter.Activity', { release: t('Filter.Activities.Dawning') })
                    }}
                  />
                  <span
                    dangerouslySetInnerHTML={{
                      __html: t('Filter.Activity', { release: t('Filter.Activities.AoT') })
                    }}
                  />
                </td>
              </tr>
            )}
            {destinyVersion === 2 && (
              <tr>
                <td>
                  <span>is:shaded</span> <span>is:hasshader</span>
                </td>
                <td>{t('Filter.HasShader')}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default connect(mapStateToProps)(FilterHelp);
