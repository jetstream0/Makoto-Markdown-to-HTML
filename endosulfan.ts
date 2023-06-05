
export let total_tests: number = 0;
export let failed_tests: number = 0;
export let passed_tests: number = 0;

export function test_assert(condition: boolean, test_name: string): boolean {
  total_tests++;
  if (condition) {
    passed_tests++;
    console.log(`\x1B[32mTEST PASS\x1B[m ${test_name}`);
    return true;
  } else {
    failed_tests++;
    console.log(`\x1B[31mTEST FAIL\x1B[m ${test_name}`);
    return false;
  }
}

type Difference = {
  start_index: number,
  end_index: number,
};

//items will probably be strings or numbers,
//but any object that is comparable after a JSON.stringify() should be fine
export function test_assert_equal(first_item: any, second_item: any, test_name: string, silent?: boolean) {
  if (typeof first_item !== typeof second_item) {
    throw Error("Cannot compare two items of different types!");
  }
  //if the items are objects (including arrays)
  if (typeof first_item === "object") {
    first_item = JSON.stringify(first_item);
    second_item = JSON.stringify(second_item);
  }
  let passed = test_assert(first_item === second_item, test_name);
  if (!silent && !passed) {
    //log info for debugging purposes
    //log both items
    console.log(`${test_name}:\n========\n${first_item}\n========\n${second_item}\n========`);
    //log differences (partially effective)
    //don't log differences if not string
    if (typeof first_item !== "string") return;
    //get longest item
    let longer = first_item.length > second_item.length ? first_item : second_item;
    //get differrences, only kinda works
    let differences: Difference[] = [];
    let offset: number = 0;
    let dispute_length: number = 0;
    for (let i=0; i < longer.length; i++) {
      if (first_item[i] === second_item[i-offset]) {
        continue;
      } else {
        if (dispute_length > 0) {
          //last loop
          if (i === longer.length-1) {
            dispute_length++;
            differences.push({
              start_index: i-dispute_length,
              end_index: i,
            });
            continue;
          }
          //see if dispute ends or continues (two characters must match)
          for (let ii=0; ii < dispute_length; ii++) {
            //change offset and add difference
            if (first_item[i] === second_item[i-dispute_length-ii] && first_item[i+1] === second_item[i-dispute_length-ii+1]) {
              differences.push({
                start_index: i-dispute_length,
                end_index: i-1,
              });
              offset = dispute_length-ii;
              dispute_length = 0;
              break;
            } else if (first_item[i] === second_item[i-dispute_length+ii] && first_item[i+1] === second_item[i-dispute_length+ii+1]) {
              differences.push({
                start_index: i-dispute_length,
                end_index: i-1,
              });
              offset = dispute_length+ii;
              dispute_length = 0;
              break;
            }
          }
          if (dispute_length === 0) {
            //dispute ends
            continue;
          }
        }
        dispute_length++;
      }
      /*
      if (first_item[i] !== second_item[i]) {
        if (first_item[i] === second_item[i-offset]) {
          continue;
        }
        //add to differences
        //if already existing difference, add to it
        let current_diff = differences.findIndex((diff) => i === diff.end_index+1);
        if (current_diff !== -1) {
          differences[current_diff].end_index = i;
        } else {
          //create new difference
          differences.push({
            start_index: i,
            end_index: i,
          });
        }
        offset++;
      }
      */
    }
    //differences not really working right now, only log the first difference
    differences = differences.length > 0 ? [differences[0]] : [];
    for (let j=0; j < differences.length; j++) {
      let diff: Difference = differences[j];
      let start_i: number = diff.start_index;
      let end_i: number = diff.end_index;
      if (diff.start_index === diff.end_index) {
        console.log(`Difference at index ${start_i}:`);
        console.log(`${first_item.slice(start_i-2, start_i)}\x1B[30;44m${first_item[start_i]}\x1B[m${first_item.slice(start_i+1,start_i+3)}`);
        console.log(`${second_item.slice(start_i-2, start_i)}\x1B[30;44m${second_item[start_i]}\x1B[m${second_item.slice(start_i+1,start_i+3)}`);
      } else {
        //multi character difference
        console.log(`Difference at indexes ${start_i} to ${end_i}:`);
        console.log(`${first_item.slice(start_i-2, start_i)}\x1B[30;44m${first_item.slice(start_i, end_i+1)}\x1B[m${first_item.slice(end_i+1,end_i+3)}`);
        console.log(`${second_item.slice(start_i-2, start_i)}\x1B[30;44m${second_item.slice(start_i, end_i+1)}\x1B[m${second_item.slice(end_i+1,end_i+3)}`);
      }
    }
  }
}

export type Warning = {
  type: string,
  message: string,
  line_number?: number,
};

export function generate_warnings(warnings: Warning[], ignore_types: string[]) {
  let ignore_count: number = 0;
  for (let i=0; i < warnings.length; i++) {
    let warning: Warning = warnings[i];
    if (ignore_types.includes(warning.type)) {
      ignore_count++;
      continue;
    }
    if (warning.line_number) {
      console.log(`\x1B[33mWarning at ${warning.line_number}:\x1B[m "${warning.message}" (type: ${warning.type})`);
    } else {
      console.log(`\x1B[33mWarning:\x1B[m "${warning.message} (type: ${warning.type})"`);
    }
  }
  console.log(`\x1B[33m${warnings.length} warnings (${ignore_count} suppressed)\x1B[m`);
}
