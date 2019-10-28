/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { withSelect } from '@wordpress/data';
import {
	ExternalLink,
	PanelBody,
	TextareaControl,
	TextControl,
	Toolbar,
	ToggleControl,
	ToolbarButton,
} from '@wordpress/components';
import {
	LEFT,
	RIGHT,
	UP,
	DOWN,
	BACKSPACE,
	ENTER,
} from '@wordpress/keycodes';
import { __ } from '@wordpress/i18n';
import {
	BlockControls,
	InnerBlocks,
	InspectorControls,
	__experimentalLinkControl as LinkControl,
} from '@wordpress/block-editor';
import { Fragment, useState, useRef } from '@wordpress/element';

function NavigationMenuItemEdit( {
	attributes,
	isSelected,
	isParentOfSelectedBlock,
	setAttributes,
	fetchSearchSuggestions,
} ) {
	const { label, link } = attributes;
	const initialLinkSetting = { 'new-tab': link.newTab };
	const [ isLinkOpen, setIsLinkOpen ] = useState( false );

	const plainTextRef = useRef( null );

	/**
	 * `onKeyDown` LinkControl handler.
	 * It takes over to stop the event propagation to make the
	 * navigation bar work, avoiding undesired behaviours.
	 * For instance, blocks to move between menu items
	 * when the LinkOver is focused.
	 *
	 * @param event
	 */
	const handleLinkControlOnKeyDown = ( event ) => {
		const { keyCode } = event;

		if ( [ LEFT, DOWN, RIGHT, UP, BACKSPACE, ENTER ].indexOf( keyCode ) > -1 ) {
			// Stop the key event from propagating up to ObserveTyping.startTypingInTextField.
			event.stopPropagation();
		}
	};

	/**
	 * Updates the link attribute when it changes
	 * through of the `onLinkChange` LinkControl callback.
	 *
	 * @param {Object|null} link The object link if it has been selected, or null.
	 */
	const updateLink = ( link ) => {
		if ( ! link ) {
			return;
		}
		setAttributes( { link } )
	};


	/**
	 * It updates the link attribute when the
	 * link settings change.
	 *
	 * @param {String} setting Setting type, for instance, `new-tab`.
	 * @param {String} value Setting type value.
	 */
	const updateLinkSetting = ( setting, value ) => {
		const newTab = 'new-tab' === setting ? value : link.newTab;
		setAttributes( { link: { ...link, newTab } } );
	};

	let content;
	if ( isSelected ) {
		content = (
			<TextControl
				ref={ plainTextRef }
				className="wp-block-navigation-menu-item__field"
				value={ label }
				onChange={ () => setIsLinkOpen( false ) }
				label={ __( 'Navigation Label' ) }
				hideLabelFromVision={ true }
			/>
		);
	} else {
		content = <div className="wp-block-navigation-menu-item__container">
			{ label }
		</div>;
	}

	return (
		<Fragment>
			<BlockControls>
				<Toolbar>
					<ToolbarButton
						name="link"
						icon="admin-links"
						title={ __( 'Link' ) }
						onClick={ () => setIsLinkOpen( ! isLinkOpen ) }
					/>
					{ isLinkOpen &&
						<LinkControl
							className="wp-block-navigation-menu-item__inline-link-input"
							onKeyDown={ handleLinkControlOnKeyDown }
							onKeyPress={ ( event ) => event.stopPropagation() }
							onClose={ ( link ) => setAttributes( { link } ) }
							currentLink={ link }
							onLinkChange={ updateLink }
							currentSettings={ initialLinkSetting }
							onSettingsChange={ updateLinkSetting }
							fetchSearchSuggestions={ fetchSearchSuggestions }
						/>
					}
				</Toolbar>
			</BlockControls>
			<InspectorControls>
				<PanelBody
					title={ __( 'Menu Settings' ) }
				>
					<ToggleControl
						checked={ attributes.opensInNewTab }
						onChange={ ( opensInNewTab ) => {
							setAttributes( { opensInNewTab } );
						} }
						label={ __( 'Open in new tab' ) }
					/>
					<TextareaControl
						value={ attributes.description || '' }
						onChange={ ( description ) => {
							setAttributes( { description } );
						} }
						label={ __( 'Description' ) }
					/>
				</PanelBody>
				<PanelBody
					title={ __( 'SEO Settings' ) }
				>
					<TextControl
						value={ attributes.title || '' }
						onChange={ ( title ) => {
							setAttributes( { title } );
						} }
						label={ __( 'Title Attribute' ) }
						help={ __( 'Provide more context about where the link goes.' ) }
					/>
					<ToggleControl
						checked={ attributes.nofollow }
						onChange={ ( nofollow ) => {
							setAttributes( { nofollow } );
						} }
						label={ __( 'Add nofollow to menu item' ) }
						help={ (
							<Fragment>
								{ __( 'Don\'t let search engines follow this link.' ) }
								<ExternalLink
									className="wp-block-navigation-menu-item__nofollow-external-link"
									href={ __( 'https://codex.wordpress.org/Nofollow' ) }
								>
									{ __( 'What\'s this?' ) }
								</ExternalLink>
							</Fragment>
						) }
					/>
				</PanelBody>
			</InspectorControls>
			<div className={ classnames(
				'wp-block-navigation-menu-item', {
					'is-editing': isSelected || isParentOfSelectedBlock,
					'is-selected': isSelected,
				} ) }
			>
				{ content }
				{ ( isSelected || isParentOfSelectedBlock ) &&
					<InnerBlocks
						allowedBlocks={ [ 'core/navigation-menu-item' ] }
					/>
				}
			</div>
		</Fragment>
	);
}

export default withSelect( ( select, ownProps ) => {
	const { hasSelectedInnerBlock, getSettings } = select( 'core/block-editor' );
	const { clientId } = ownProps;

	return {
		isParentOfSelectedBlock: hasSelectedInnerBlock( clientId, true ),
		fetchSearchSuggestions: getSettings().__experimentalFetchLinkSuggestions,
	};
} )( NavigationMenuItemEdit );
