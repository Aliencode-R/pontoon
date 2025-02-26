import parser from './parser';
import serializer from './serializer';


/**
 * Return a reconstructed Fluent message from the original message and some
 * translated content.
 */
export default function getReconstructedSimpleMessage(original, translation) {
    const message = parser.parseEntry(original);
    let key = message.id.name;

    // For Terms, the leading dash is removed in the identifier. We need to add
    // it back manually.
    if (message.type === 'Term') {
        key = '-' + key;
    }

    const isMultilineTranslation = translation.indexOf('\n') > -1;

    let content;

    if (message.attributes && message.attributes.length === 1) {
        const attribute = message.attributes[0].id.name;

        if (isMultilineTranslation) {
            content = `${key} =\n    .${attribute} =`;
            translation.split('\n').forEach(t => content += `\n        ${t}`);
        }
        else {
            content = `${key} =\n    .${attribute} = ${translation}`;
        }
    }
    else {
        if (isMultilineTranslation) {
            content = `${key} =`;
            translation.split('\n').forEach(t => content += `\n    ${t}`);
        }
        else {
            content = `${key} = ${translation}`;
        }
    }

    // Ensure strings are serialized with default serializer settings
    const ast = parser.parseEntry(content);
    return serializer.serializeEntry(ast);
}
