public  with sharing class FunctionApex {
    
    @AuraEnabled(cacheable=true)
    public static void FunctionApex(String miId) {

        System.debug('Invoking zipFunction');

        functions.Function myFunction = functions.Function.get('zipFunction');
        functions.FunctionInvocation invocation = myFunction.invoke('{"contentVersionId" : "068S0000001dM01IAE"}');
        String jsonResponse = invocation.getResponse();

        System.debug('Response from zipFunction ' + jsonResponse);

    }
}
