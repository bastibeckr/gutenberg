# Link Control

### className

- Type: `string`
- Required: NO

### fetchSearchSuggestions

- Type: `Function`
- Required: YES

### currentLink

- Type:
- Required:

### linkSettings

- Type:
- Required:

## Event handlers

### onClose

- Type: `Function`
- Required:

### onKeyDown

- Type: `Function`
- Required:

### onKeyPress

- Type: `Function`
- Required:

### onLinkChange

- Type: `Function`
- Required:

Use this callback as an opportunity to know if the link has been changed because of user edition.
The function callback will get selected item, or Null.

```es6
<LinkControl
	onLinkChange={ ( item ) => {
		item
			? console.log( `The item selected has the ${ item.id } id` )
			: console.warn( 'not Item selected' );
	}
/> 
```  

### onSettingChange

- Type: `Function`
- Required:
