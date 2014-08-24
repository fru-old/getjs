



function expired(){
	throw new Error('This reference has expired.');
}


// get (problem when id is generated it needs to be cloned)
// childrenFind (must return context)
// childrenNext (must return context)
// childrenRun (add operation to pending)
// internal
// hidding doesnt use timestamps and hence it is implemented here


// pending persistant 
// (may be 2. result of operation)
// (is then executed always before everythig else)
// (persist has a minimal timestamp)
// interceptor has to be on node not on context
// event context can not trigger secondary events 
// get.symbol -> tags.id created on read
// clone stream
// two way binding: -render subtree twice -events change subtree
// resolve _ in node get so the type of node can be concidered
// or resolve via reference prop to attr values

// is it possible to have a dupplicate sub tree in tree and ensure no loops?
// how to handel events?

