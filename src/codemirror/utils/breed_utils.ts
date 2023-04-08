import { BreedLocation } from '../../lang/classes';

/** getBreedName: Parse the breed primitive for breed name. */
export const getBreedName = function (value: string) {
  let result = checkBreedLike(value);
  let str = '';
  if (result[0]) {
    //pull out name of possible intended breed
    let split = value.split('-');
    if (result[1] == BreedLocation.Third) {
      str = split.slice(2).join('-');
    } else if (result[1] == BreedLocation.Second) {
      str = split.slice(1).join('-');
    } else if (result[1] == BreedLocation.First) {
      str = split.slice(0, split.length - 1).join('-');
    } else if (result[1] == BreedLocation.Middle) {
      str = split.slice(1, split.length - 1).join('-');
    } else if (result[1] == BreedLocation.Question) {
      str = split.slice(1).join('-');
      str = str.substring(0, str.length - 1);
    }
  }
  return str;
};

/** checkBreedLike: Identify if an identifier looks like a breed procedure,
 and where the breed name is inside that identifier **/
export const checkBreedLike = function (str: string) {
  let result = false;
  let location = BreedLocation.Null;
  if (str.match(/^in-[^\s]+-from$/)) {
    result = true;
    location = BreedLocation.Middle;
  } else if (str.match(/^(in|out)-[^\s]+-(neighbors)$/)) {
    result = true;
    location = BreedLocation.Middle;
  } else if (str.match(/^(in|out)-[^\s]+-(neighbor\\?)$/)) {
    result = true;
    location = BreedLocation.Middle;
  } else if (str.match(/^out-[^\s]+-to$/)) {
    result = true;
    location = BreedLocation.Middle;
  } else if (str.match(/^create-[^\s]+-(to|from|with)$/)) {
    result = true;
    location = BreedLocation.Middle;
  } else if (str.match(/^create-ordered-[^\s]+/)) {
    result = true;
    location = BreedLocation.Third;
  } else if (str.match(/^(hatch|sprout|create)-[^\s]+/)) {
    result = true;
    location = BreedLocation.Second;
  } else if (str.match(/[^\s]+-(at)/)) {
    result = true;
    location = BreedLocation.First;
  } else if (str.match(/[^\s]+-here/)) {
    result = true;
    location = BreedLocation.First;
  } else if (str.match(/[^\s]+-neighbors/)) {
    result = true;
    location = BreedLocation.First;
  } else if (str.match(/[^\s]+-on/)) {
    result = true;
    location = BreedLocation.First;
  } else if (str.match(/[^\s]+-(with|neighbor\\?)/)) {
    result = true;
    location = BreedLocation.First;
  } else if (str.match(/^(my-in|my-out)-[^\s]+/)) {
    result = true;
    location = BreedLocation.Third;
  } else if (str.match(/^(my)-[^\s]+/)) {
    result = true;
    location = BreedLocation.Second;
  } else if (str.match(/^is-[^\s]+\\?$/)) {
    result = true;
    location = BreedLocation.Question;
  }
  return [result, location];
};
