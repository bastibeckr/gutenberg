/**
 * WordPress dependencies
 */
import {
	clickMenuItem,
	insertBlock,
	insertReusableBlock,
	createNewPost,
	clickBlockToolbarButton,
	pressKeyWithModifier,
	getEditedPostContent,
	trashAllPosts,
	visitAdminPage,
	toggleGlobalBlockInserter,
	openDocumentSettingsSidebar,
	saveDraft,
} from '@wordpress/e2e-test-utils';

const reusableBlockNameInputSelector =
	'.block-editor-block-inspector .components-text-control__input';

const saveAll = async () => {
	await page.click( '.editor-post-publish-button__button.has-changes-dot' );
	await page.waitForSelector(
		'button.editor-entities-saved-states__save-button'
	);
	await page.click( 'button.editor-entities-saved-states__save-button' );

	// no need to publish the post.
	const cancelPublish = await page.waitForSelector(
		'.editor-post-publish-panel__header-cancel-button button'
	);
	await cancelPublish.click();
};

const clearAllBlocks = async () => {
	// Remove all blocks from the post so that we're working with a clean slate
	await page.evaluate( () => {
		const blocks = wp.data.select( 'core/block-editor' ).getBlocks();
		const clientIds = blocks.map( ( block ) => block.clientId );
		wp.data.dispatch( 'core/block-editor' ).removeBlocks( clientIds );
	} );
};

const createReusableBlock = async ( content, title ) => {
	// Insert a paragraph block
	await insertBlock( 'Paragraph' );
	await page.keyboard.type( content );

	await clickBlockToolbarButton( 'More options' );
	await clickMenuItem( 'Add to Reusable blocks' );

	// Wait for creation to finish
	await page.waitForXPath(
		'//*[contains(@class, "components-snackbar")]/*[text()="Block created."]'
	);

	// Check that we have a reusable block on the page
	const block = await page.waitForSelector(
		'.block-editor-block-list__block[data-type="core/block"]'
	);
	expect( block ).not.toBeNull();

	await openDocumentSettingsSidebar();
	const nameInput = await page.waitForSelector(
		reusableBlockNameInputSelector
	);
	if ( title ) {
		await nameInput.click();

		// Select all of the text in the title field.
		await pressKeyWithModifier( 'primary', 'a' );

		// Give the reusable block a title
		await page.keyboard.type( title );
	}
};

describe( 'Reusable blocks', () => {
	beforeAll( async () => {
		await createNewPost();
	} );

	afterAll( async () => {
		await trashAllPosts( 'wp_block' );
	} );

	beforeEach( async () => {
		await clearAllBlocks();
	} );

	it( 'can be created with no title', async () => {
		await createReusableBlock( 'Hello there!' );
		await openDocumentSettingsSidebar();
		const title = await page.$eval(
			reusableBlockNameInputSelector,
			( element ) => element.value
		);
		expect( title ).toBe( 'Untitled Reusable Block' );
	} );

	it( 'can be created, inserted, edited and converted to a regular block.', async () => {
		await createReusableBlock( 'Hello there!', 'Greeting block' );
		await saveAll();
		await clearAllBlocks();

		// Insert the reusable block we created above
		await insertReusableBlock( 'Greeting block' );

		// Change the block's title
		await openDocumentSettingsSidebar();
		const nameInput = await page.waitForSelector(
			reusableBlockNameInputSelector
		);
		await nameInput.click();
		await pressKeyWithModifier( 'primary', 'a' );
		await page.keyboard.type( 'Surprised greeting block' );

		// Quickly focus the paragraph block
		await page.click(
			'.block-editor-block-list__block[data-type="core/block"] p'
		);
		await page.keyboard.press( 'Escape' ); // Enter navigation mode
		await page.keyboard.press( 'Enter' ); // Enter edit mode

		// Change the block's content
		await page.keyboard.type( 'Oh! ' );

		// Save the reusable block
		await saveAll();

		// Check that its content is up to date
		const text = await page.$eval(
			'.block-editor-block-list__block[data-type="core/block"] p',
			( element ) => element.innerText
		);
		expect( text ).toMatch( 'Oh! Hello there!' );

		await clearAllBlocks();

		// Insert the reusable block we edited above
		await insertReusableBlock( 'Surprised greeting block' );

		// Convert block to a regular block
		await clickBlockToolbarButton( 'Convert to regular blocks', 'content' );

		// Check that we have a paragraph block on the page
		const paragraphBlock = await page.$(
			'.block-editor-block-list__block[data-type="core/paragraph"]'
		);
		expect( paragraphBlock ).not.toBeNull();

		// Check that its content is up to date
		const paragraphContent = await page.$eval(
			'.block-editor-block-list__block[data-type="core/paragraph"]',
			( element ) => element.innerText
		);
		expect( paragraphContent ).toMatch( 'Oh! Hello there!' );
	} );

	it( 'can be inserted after refresh', async () => {
		await createReusableBlock( 'Awesome Paragraph', 'Awesome block' );

		// Save the reusable block
		await saveAll();

		// Step 2. Create new post.
		await createNewPost();

		// Step 3. Insert the block created in Step 1.
		await insertReusableBlock( 'Awesome block' );

		// Check the title.
		await openDocumentSettingsSidebar();
		const title = await page.$eval(
			reusableBlockNameInputSelector,
			( element ) => element.value
		);
		expect( title ).toBe( 'Awesome block' );
	} );

	it( 'can be created from multiselection and converted back to regular blocks', async () => {
		await createNewPost();

		// Insert a Two paragraphs block
		await insertBlock( 'Paragraph' );
		await page.keyboard.type( 'Hello there!' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Second paragraph' );

		// Select all the blocks
		await pressKeyWithModifier( 'primary', 'a' );
		await pressKeyWithModifier( 'primary', 'a' );

		// Convert block to a reusable block
		await clickBlockToolbarButton( 'More options' );
		await clickMenuItem( 'Add to Reusable blocks' );

		// Wait for creation to finish
		await page.waitForXPath(
			'//*[contains(@class, "components-snackbar")]/*[text()="Block created."]'
		);

		// Set title.
		await openDocumentSettingsSidebar();
		const nameInput = await page.waitForSelector(
			reusableBlockNameInputSelector
		);
		await nameInput.click();
		await pressKeyWithModifier( 'primary', 'a' );
		await page.keyboard.type( 'Multi-selection reusable block' );

		// Save the reusable block
		await saveAll();

		await clearAllBlocks();

		// Insert the reusable block we edited above
		await insertReusableBlock( 'Multi-selection reusable block' );

		// Convert block to a regular block
		await clickBlockToolbarButton( 'Convert to regular blocks', 'content' );

		// Check that we have two paragraph blocks on the page
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'will not break the editor if empty', async () => {
		await createReusableBlock(
			'Awesome Paragraph',
			'Random reusable block'
		);
		await saveAll();
		await clearAllBlocks();
		await insertReusableBlock( 'Random reusable block' );

		await visitAdminPage( 'edit.php', [ 'post_type=wp_block' ] );

		const [ editButton ] = await page.$x(
			`//a[contains(@aria-label, 'Random reusable block')]`
		);
		await editButton.click();

		await page.waitForNavigation();

		// Click the block to give it focus
		const blockSelector = 'p[data-title="Paragraph"]';
		await page.waitForSelector( blockSelector );
		await page.click( blockSelector );

		// Delete the block, leaving the reusable block empty
		await clickBlockToolbarButton( 'More options' );
		const deleteButton = await page.waitForXPath(
			'//button/span[text()="Remove block"]'
		);
		deleteButton.click();

		// Wait for the Update button to become enabled
		const publishButtonSelector = '.editor-post-publish-button__button';
		await page.waitForSelector(
			publishButtonSelector + '[aria-disabled="false"]'
		);

		// Save the reusable block
		await page.click( publishButtonSelector );
		await page.waitForXPath(
			'//*[contains(@class, "components-snackbar")]/*[text()="Reusable Block updated."]'
		);

		await createNewPost();

		await toggleGlobalBlockInserter();

		expect( console ).not.toHaveErrored();
	} );

	it( 'Should show a proper message when the reusable block is missing', async () => {
		// Insert a non-existant reusable block
		await page.evaluate( () => {
			const { createBlock } = window.wp.blocks;
			const { dispatch } = window.wp.data;
			dispatch( 'core/block-editor' ).resetBlocks( [
				createBlock( 'core/block', { ref: 123456 } ),
			] );
		} );

		await page.waitForXPath(
			'//*[contains(@class, "block-editor-warning")]/*[text()="Block has been deleted or is unavailable."]'
		);

		// This happens when the 404 is returned.
		expect( console ).toHaveErrored();
	} );

	it( 'should be able to insert a reusable block twice', async () => {
		await createReusableBlock(
			'Awesome Paragraph',
			'Duplicated reusable block'
		);
		await saveAll();
		await clearAllBlocks();
		await insertReusableBlock( 'Duplicated reusable block' );
		await insertReusableBlock( 'Duplicated reusable block' );
		await saveDraft();
		await page.reload();

		// Replace the content of the  first paragraph
		const paragraphBlock = await page.waitForSelector(
			'.block-editor-block-list__block[data-type="core/paragraph"]'
		);
		paragraphBlock.focus();
		await pressKeyWithModifier( 'primary', 'a' );
		await page.keyboard.press( 'End' );
		await page.keyboard.type( ' modified' );

		// Wait for async mode to dispatch the update.
		// eslint-disable-next-line no-restricted-syntax
		await page.waitFor( 1000 );

		// Check that the content of the second reusable block has been updated.
		const reusableBlocks = await page.$$( '.wp-block-block' );
		reusableBlocks.forEach( async ( paragraph ) => {
			const content = await paragraph.$eval(
				'p',
				( element ) => element.textContent
			);
			expect( content ).toEqual( 'Awesome Paragraph modified' );
		} );
	} );
} );
