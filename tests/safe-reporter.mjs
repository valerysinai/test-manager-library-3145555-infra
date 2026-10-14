export default class SafeReporter {
  onStdOut(chunk){for(const line of String(chunk).split('\n'))if(/^::notice::Report (HTTP status|row count): [0-9]+$/.test(line))console.log(line);}
  onTestEnd(test,result){
    const title=/^[A-Za-z0-9 -]+$/.test(test.title)?test.title:'journey';
    if(result.status==='passed'){console.log('Integrated browser check passed: '+title);return;}
    const stages=test.annotations.filter(a=>a.type==='stage').map(a=>a.description).filter(a=>/^[a-z-]+$/.test(a));
    console.log('::error::Integrated browser check failed: '+title+'; stage: '+(stages.at(-1)||'startup'));
    for(const error of result.errors){
      for(const [pattern,reason] of [[/strict mode violation/,'ambiguous-control'],[/did not find some options/,'missing-option'],[/Timeout|timed out/,'timeout'],[/ERR_CERT/,'certificate-trust']]){
        if(pattern.test(error.message||''))console.log('::error::Browser check reason: '+reason);
      }
      const matches=(error.stack||'').match(/\/work\/tests\/[A-Za-z0-9_.-]+:\d+:\d+/g)||[];
      for(const location of new Set(matches))console.log('::error::Browser check code location: '+location);
    }
  }
}
