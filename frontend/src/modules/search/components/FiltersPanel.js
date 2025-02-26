/* @flow */

import * as React from 'react';
import onClickOutside from 'react-onclickoutside';
import { Localized } from 'fluent-react';

import './FiltersPanel.css';

import { FILTERS_STATUS, FILTERS_EXTRA } from '..';

import { asLocaleString } from 'core/utils';

import type { NavigationParams } from 'core/navigation';
import type { Tag } from 'core/project';
import type { Stats } from 'core/stats';
import type { Author } from 'modules/search';


type Props = {|
    statuses: { [string]: boolean },
    extras: { [string]: boolean },
    tags: { [string]: boolean },
    authors: { [string]: boolean },
    authorsData: Array<Author>,
    tagsData: Array<Tag>,
    timeRangeData: Array<Array<number>>,
    stats: Stats,
    parameters: NavigationParams,
    applySingleFilter: (filter: string, type: string, callback?: () => void) => void,
    getAuthorsAndTimeRangeData: () => void,
    resetFilters: () => void,
    toggleFilter: (string, string) => void,
    update: () => void,
|};

type State = {|
    visible: boolean,
|};


/**
 * Shows a list of filters used to filter the list of entities.
 *
 * Changes to the filters will be reflected in the URL.
 */
export class FiltersPanelBase extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            visible: false,
        };
    }

    componentDidUpdate(prevProps: Props, prevState: State) {
        if (
            this.state.visible &&
            !prevState.visible &&
            this.props.parameters.project !== 'all-projects'
        ) {
            this.props.getAuthorsAndTimeRangeData();
        }
    }

    toggleVisibility = () => {
        this.setState(state => {
            return { visible: !state.visible };
        });
    }

    applyFilters = () => {
        this.toggleVisibility();
        return this.props.update();
    }

    createToggleFilter = (filter: string, type: string) => {
        if (filter === 'all') {
            return null;
        }

        return (event: SyntheticInputEvent<>) => {
            event.stopPropagation();
            this.props.toggleFilter(filter, type);
        };
    }

    createApplySingleFilter(filter: string, type: string) {
        return () => {
            this.toggleVisibility();
            this.props.applySingleFilter(filter, type, this.props.update);
        };
    }

    // This method is called by the Higher-Order Component `onClickOutside`
    // when a user clicks outside the search panel.
    handleClickOutside = () => {
        this.setState({
            visible: false,
        });
    }

    render() {
        const props = this.props;
        const { project, resource } = this.props.parameters;

        const selectedStatuses = Object.keys(props.statuses).filter(s => props.statuses[s]);
        const selectedExtras = Object.keys(props.extras).filter(e => props.extras[e]);
        const selectedTags = Object.keys(props.tags).filter(t => props.tags[t]);
        const selectedAuthors = Object.keys(props.authors).filter(a => props.authors[a]);

        const selectedFiltersCount = (
            selectedExtras.length +
            selectedStatuses.length +
            selectedTags.length +
            selectedAuthors.length
        );

        // If there are zero or several selected statuses, show the "All" icon.
        let filterIcon = 'all';

        // Otherwise show the approriate status icon.
        if (selectedFiltersCount === 1) {
            const selectedStatus = FILTERS_STATUS.find(f => f.slug === selectedStatuses[0]);
            if (selectedStatus) {
                filterIcon = selectedStatus.slug;
            }

            const selectedExtra = FILTERS_EXTRA.find(f => f.slug === selectedExtras[0]);
            if (selectedExtra) {
                filterIcon = selectedExtra.slug;
            }

            const selectedTag = props.tagsData.find(f => f.slug === selectedTags[0]);
            if (selectedTag) {
                filterIcon = 'tag';
            }

            const selectedAuthor = props.authorsData.find(f => f.email === selectedAuthors[0]);
            if (selectedAuthor) {
                filterIcon = 'author';
            }
        }

        return <div className="filters-panel">
            <div
                className={ `visibility-switch ${filterIcon}` }
                onClick={ this.toggleVisibility }
            >
                <span className="status fa"></span>
            </div>
            { !this.state.visible ? null : <div className="menu">
                <ul>
                    <Localized id="search-FiltersPanel--heading-status">
                        <li className="horizontal-separator">Translation Status</li>
                    </Localized>

                    { FILTERS_STATUS.map((status, i) => {
                        const count = status.stat ? props.stats[status.stat] : props.stats[status.slug];
                        const selected = props.statuses[status.slug];

                        let className = status.slug;
                        if (selected && status.slug !== 'all') {
                            className += ' selected';
                        }

                        return <li
                            className={ className }
                            key={ i }
                            onClick={ this.createApplySingleFilter(status.slug, 'statuses') }
                        >
                            <span
                                className="status fa"
                                onClick={ this.createToggleFilter(status.slug, 'statuses') }
                            ></span>
                            <span className="title">{ status.name }</span>
                            <span className="count">
                                { asLocaleString(count) }
                            </span>
                        </li>
                    }) }

                    { (props.tagsData.length === 0 || resource !== 'all-resources') ? null : <>
                        <Localized id="search-FiltersPanel--heading-tags">
                            <li className="horizontal-separator">Tags</li>
                        </Localized>

                        { props.tagsData.map((tag, i) => {
                            const selected = props.tags[tag.slug];

                            let className = tag.slug;
                            if (selected) {
                                className += ' selected';
                            }

                            return <li
                                className={ `tag ${className}` }
                                key={ i }
                                onClick={ this.createApplySingleFilter(tag.slug, 'tags') }
                            >
                                <span
                                    className="status fa"
                                    onClick={ this.createToggleFilter(tag.slug, 'tags') }
                                ></span>
                                <span className="title">{ tag.name }</span>
                                <span className="priority">
                                    { [1, 2, 3, 4, 5].map((index) => {
                                        const active = index < tag.priority ? 'active' : '';
                                        return <span
                                            className={ `fa fa-star ${active}` }
                                            key={ index }
                                        ></span>;
                                    }) }
                                </span>
                            </li>
                        }) }
                    </>}

                    <Localized id="search-FiltersPanel--heading-extra">
                        <li className="horizontal-separator">Extra Filters</li>
                    </Localized>

                    { FILTERS_EXTRA.map((extra, i) => {
                        const selected = props.extras[extra.slug];

                        let className = extra.slug;
                        if (selected) {
                            className += ' selected';
                        }

                        return <li
                            className={ className }
                            key={ i }
                            onClick={ this.createApplySingleFilter(extra.slug, 'extras') }
                        >
                            <span
                                className="status fa"
                                onClick={ this.createToggleFilter(extra.slug, 'extras') }
                            ></span>
                            <span className="title">{ extra.name }</span>
                        </li>
                    }) }

                    { (props.authorsData.length === 0 || project === 'all-projects') ? null : <>
                        <Localized id="search-FiltersPanel--heading-authors">
                            <li className="horizontal-separator">Translation Authors</li>
                        </Localized>

                        { props.authorsData.map((author, i) => {
                            const selected = props.authors[author.email];

                            let className = 'author';
                            if (selected) {
                                className += ' selected';
                            }

                            return <li
                                className={ `${className}` }
                                key={ i }
                                onClick={ this.createApplySingleFilter(author.email, 'authors') }
                            >
                                <figure>
                                    <span className="sel">
                                        <span
                                            className="status fa"
                                            onClick={ this.createToggleFilter(author.email, 'authors') }
                                        ></span>
                                        <img
                                            alt=""
                                            className="rounded"
                                            src={ author.gravatar_url }
                                        />
                                    </span>
                                    <figcaption>
                                        <p className="name">{ author.display_name }</p>
                                        <p className="role">{ author.role }</p>
                                    </figcaption>
                                    <span className="count">
                                        { asLocaleString(author.translation_count) }
                                    </span>
                                </figure>
                            </li>
                        }) }
                    </>}
                </ul>
                { selectedFiltersCount === 0 ? null :
                <div className="toolbar clearfix">
                    <Localized
                        id="search-FiltersPanel--clear-selection"
                        attrs={ { title: true } }
                        glyph={ <i className="fa fa-times fa-lg"></i> }
                    >
                        <button
                            title="Uncheck selected filters"
                            onClick={ this.props.resetFilters }
                            className="clear-selection"
                        >
                            <i className="fa fa-times fa-lg"></i>
                            Clear
                        </button>
                    </Localized>
                    <Localized
                        id="search-FiltersPanel--apply-filters"
                        attrs={ { title: true } }
                        glyph={ <i className="fa fa-check fa-lg"></i> }
                        stress={ <span className="applied-count"></span> }
                        $count={ selectedFiltersCount }
                    >
                        <button
                            title="Apply Selected Filters"
                            onClick={ this.applyFilters }
                            className="apply-selected"
                        >
                            <i className="fa fa-check fa-lg"></i>
                            { 'Apply <stress>{ $count }</stress> filters' }
                        </button>
                    </Localized>
                </div> }
            </div> }
        </div>;
    }
}


export default onClickOutside(FiltersPanelBase);
