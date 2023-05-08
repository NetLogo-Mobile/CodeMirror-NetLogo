import { BreedLocation } from '../../lang/classes/structures';

/** getBreedName: Parse the breed primitive for breed name. */
export const getBreedName = function (value: string) {
  let result = checkBreedLike(value);
  let str = '';
  if (result.found) {
    //pull out name of possible intended breed
    let split = value.split('-');
    if (result.location == BreedLocation.Third) {
      str = split.slice(2).join('-');
    } else if (result.location == BreedLocation.Second) {
      str = split.slice(1).join('-');
    } else if (result.location == BreedLocation.First) {
      str = split.slice(0, split.length - 1).join('-');
    } else if (result.location == BreedLocation.Middle) {
      str = split.slice(1, split.length - 1).join('-');
    } else if (result.location == BreedLocation.Question) {
      str = split.slice(1).join('-');
      str = str.substring(0, str.length - 1);
    }
  }
  return {
    breed: str,
    isPlural: result.isPlural,
    isLink: result.isLink,
  };
};

/** checkBreedLike: Identify if an identifier looks like a breed procedure,
 and where the breed name is inside that identifier **/
export const checkBreedLike = function (str: string) {
  let result = {
    found: false,
    location: BreedLocation.Null,
    isPlural: false,
    isLink: false,
  };
  if (str.match(/^in-[^\s]+-from$/)) {
    result.found = true;
    result.location = BreedLocation.Middle;
    result.isPlural = false;
    result.isLink = true;
  } else if (str.match(/^(in|out)-[^\s]+-(neighbors)$/)) {
    result.found = true;
    result.location = BreedLocation.Middle;
    result.isPlural = false;
    result.isLink = true;
  } else if (str.match(/^(in|out)-[^\s]+-(neighbor\\?)$/)) {
    result.found = true;
    result.location = BreedLocation.Middle;
    result.isPlural = false;
    result.isLink = true;
  } else if (str.match(/^out-[^\s]+-to$/)) {
    result.found = true;
    result.location = BreedLocation.Middle;
    result.isPlural = false;
    result.isLink = true;
  } else if (str.match(/^create-[^\s]+-(to|from|with)$/)) {
    result.found = true;
    result.location = BreedLocation.Middle;
    result.isPlural = false;
    result.isLink = true;
  } else if (str.match(/^create-ordered-[^\s]+/)) {
    result.found = true;
    result.location = BreedLocation.Third;
    result.isPlural = true;
    result.isLink = false;
  } else if (str.match(/^(hatch|sprout|create)-[^\s]+/)) {
    result.found = true;
    result.location = BreedLocation.Second;
    result.isPlural = true;
    result.isLink = false;
  } else if (str.match(/[^\s]+-(at)/)) {
    result.found = true;
    result.location = BreedLocation.First;
    result.isPlural = true;
    result.isLink = false;
  } else if (str.match(/[^\s]+-here/)) {
    result.found = true;
    result.location = BreedLocation.First;
    result.isPlural = true;
    result.isLink = false;
  } else if (str.match(/[^\s]+-neighbors/)) {
    result.found = true;
    result.location = BreedLocation.First;
    result.isPlural = false;
    result.isLink = true;
  } else if (str.match(/[^\s]+-on/)) {
    result.found = true;
    result.location = BreedLocation.First;
    result.isPlural = true;
    result.isLink = false;
  } else if (str.match(/[^\s]+-(with|neighbor\\?)/)) {
    result.found = true;
    result.location = BreedLocation.First;
    result.isPlural = false;
    result.isLink = true;
  } else if (str.match(/^(my-in|my-out)-[^\s]+/)) {
    result.found = true;
    result.location = BreedLocation.Third;
    result.isPlural = true;
    result.isLink = true;
  } else if (str.match(/^(my)-[^\s]+/)) {
    result.found = true;
    result.location = BreedLocation.Second;
    result.isPlural = true;
    result.isLink = true;
  } else if (str.match(/^is-[^\s]+\\?$/)) {
    result.found = true;
    result.location = BreedLocation.Question;
    result.isPlural = false;
    result.isLink = false;
  } else if (str.match(/[^\s]+-own$/)) {
    result.found = true;
    result.location = BreedLocation.Question;
    result.isPlural = true;
    result.isLink = false;
  }
  return result;
};

export const otherBreedName = function (breed: string, isPlural: boolean) {
  if (isPlural) {
    if (breed[breed.length - 1] == 's') {
      return breed.substring(0, breed.length - 1);
    } else {
      return 'a-' + breed;
    }
  } else {
    if (breed[breed.length - 1] == 's') {
      return breed + 'es';
    } else {
      return breed + 's';
    }
  }
};
