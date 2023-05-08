import { Breed } from '../../lang/classes/structures';
import { EditorState } from '@codemirror/state';
import { syntaxTree } from '@codemirror/language';

/** classifyPrimitive: Identify type of reporter/command for appropriate tooltip. */
export const classifyPrimitive = function (name: string) {
  //classify all types of reporter as 'breed','custom', or builtin
  if (name.indexOf('Reporter') != -1) {
    if (name.indexOf('Special') != -1) {
      if (
        name.indexOf('Turtle') != -1 ||
        name.indexOf('Link') != -1 ||
        name.indexOf('Both') != -1
      ) {
        name = 'BreedReporter';
      } else {
        name = 'CustomReporter';
      }
    } else {
      name = 'Reporter';
    }
  }

  //classify all types of commands as 'breed','custom', or builtin
  if (name.indexOf('Command') != -1) {
    if (name.indexOf('Special') != -1) {
      if (name.indexOf('Create') != -1) {
        name = 'BreedCommand';
      } else {
        name = 'CustomCommand';
      }
    } else {
      name = 'Command';
    }
  }
  return name;
};

/** classifyBreedName: Identify if breed name is plural or singular. */
export const classifyBreedName = function (term: string, breeds: Breed[]) {
  let plurals: string[] = [];
  let singular: string[] = [];
  let closestTerm = '';
  for (let b of breeds) {
    plurals.push(b.Plural);
    singular.push(b.Singular);
  }
  if (plurals.includes(term)) {
    closestTerm = '~BreedPlural';
  } else {
    closestTerm = '~BreedSingular';
  }
  return closestTerm;
};

/** getLink: Identify internal link for tooltips (e.g. creation of variable). */
export const getLink = function (
  nodeName: string,
  childName: string,
  term: string,
  state: EditorState
) {
  let linkData = {
    to: 0,
    from: 0,
    hasLink: false,
  };

  syntaxTree(state)
    .cursor()
    .iterate((node) => {
      if (node.name == nodeName) {
        node.node.getChildren(childName).map((subnode) => {
          if (state.sliceDoc(subnode.from, subnode.to) == term) {
            linkData = {
              to: subnode.to,
              from: subnode.from,
              hasLink: true,
            };
          }
        });
      }
    });
  return linkData;
};
