import {
  decode as base64Decode,
  encode as base64Encode,
} from 'https://deno.land/std@0.82.0/encoding/base64.ts'

export function getRandomInt(min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export var B64XorCipher = {
  encode: function(key, data) {
    return base64Encode(xorEncode(key, data), 'utf8')
  },

  decode: function(key, data) {
    data = base64Decode(data)
    return xorDecode(key, data);
  }
}

function xorEncode(key, input){
  var output = '';
  for ( var i = 0 ; i < input.length ; i++){
    var c = input.charCodeAt( i );
    var k = key.charCodeAt( i % key.length );
    output += String.fromCharCode( c ^ k );
  }
  return output;
}

function xorDecode(key, input){
  var output = '';
  for ( var i = 0 ; i < input.length ; i++){
    var c = input[i];
    var k = key.charCodeAt( i % key.length );
    output += String.fromCharCode( c ^ k );
  }
  return output;
}
