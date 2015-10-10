casper.test.begin('Search for non-existent callsign', function suite(test) {

    casper.start("http://localhost:3000/", function() {

        test.assertHttpStatus(200);

        // perform a search
        test.assertExists('form[action="/"]', "search form found");
        this.fill('form[action="/"]', {
            q: "kb1epr"
        }, true);

    }).then(function() {

        test.assertHttpStatus(404);
        test.assertEvalEquals(function() { return __utils__.findOne('#err-message').textContent; }, 'No results found.', 'message to indicate that callsign was not found.');

    }).run(function() {

        test.done();

    });

});

casper.test.begin('Search for existing callsign belonging to an individual', function suite(test) {

    casper.start("http://localhost:3000/", function() {

        test.assertHttpStatus(200);

        // perform a search
        test.assertExists('form[action="/"]', "search form found");
        this.fill('form[action="/"]', {
            q: "va2epr"
        }, true);

    }).then(function() {

        test.assertHttpStatus(200);

        // check that we ended up on the right page
        test.assertUrlMatch(/\/callsigns\/VA2EPR$/, "redirected to the callsign page");
        test.assertTitleMatch(/VA2EPR/, 'title includes callsign');

        // spot check a few fields
        test.assertEvalEquals(function() { return __utils__.findOne('#callsign').textContent; }, 'VA2EPR', 'callsign is set');
        test.assertEvalEquals(function() { return __utils__.findOne('#first_name').textContent; }, 'Thomas', 'first_name is set');
        test.assertEvalEquals(function() { return __utils__.findOne('#surname').textContent; }, 'Cort', 'last_name is set');

    }).run(function() {

        test.done();

    });

});

casper.test.begin('Search for existing callsign belonging to a club', function suite(test) {

    casper.start("http://localhost:3000/", function() {

        test.assertHttpStatus(200);

        // perform a search
        test.assertExists('form[action="/"]', "search form found");
        this.fill('form[action="/"]', {
            q: "va3ovq"
        }, true);

    }).then(function() {

        test.assertHttpStatus(200);

        // check that we ended up on the right page
        test.assertUrlMatch(/\/callsigns\/VA3OVQ$/, "redirected to the callsign page");
        test.assertTitleMatch(/VA3OVQ/, 'title includes callsign');

        // spot check a few fields
        test.assertEvalEquals(function() { return __utils__.findOne('#callsign').textContent; }, 'VA3OVQ', 'callsign is set');
        test.assertEvalEquals(function() { return __utils__.findOne('#club_prov_cd').textContent; }, 'ON', 'club_prov_cd is set');

    }).run(function() {

        test.done();

    });

});

casper.test.begin('Go directly to a callsign page belonging to an individual', function suite(test) {

    casper.start("http://localhost:3000/callsigns/VA2EPR", function() {

        test.assertHttpStatus(200);

        // check that we ended up on the right page
        test.assertUrlMatch(/\/callsigns\/VA2EPR$/, "redirected to the callsign page");
        test.assertTitleMatch(/VA2EPR/, 'title includes callsign');

        // spot check a few fields
        test.assertEvalEquals(function() { return __utils__.findOne('#callsign').textContent; }, 'VA2EPR', 'callsign is set');
        test.assertEvalEquals(function() { return __utils__.findOne('#first_name').textContent; }, 'Thomas', 'first_name is set');
        test.assertEvalEquals(function() { return __utils__.findOne('#surname').textContent; }, 'Cort', 'last_name is set');

    }).run(function() {

        test.done();

    });

});

casper.test.begin('Go directly to a callsign page belonging to a club', function suite(test) {

    casper.start("http://localhost:3000/callsigns/VA3OVQ", function() {

        test.assertHttpStatus(200);

        // check that we ended up on the right page
        test.assertUrlMatch(/\/callsigns\/VA3OVQ$/, "redirected to the callsign page");
        test.assertTitleMatch(/VA3OVQ/, 'title includes callsign');

        // spot check a few fields
        test.assertEvalEquals(function() { return __utils__.findOne('#callsign').textContent; }, 'VA3OVQ', 'callsign is set');
        test.assertEvalEquals(function() { return __utils__.findOne('#club_prov_cd').textContent; }, 'ON', 'club_prov_cd is set');

    }).run(function() {

        test.done();

    });

});

casper.test.begin('i18n', function suite(test) {

    casper.start("http://localhost:3000/", function() {

        test.assertHttpStatus(200);
        test.assertTitleMatch(/Callsigns/, 'title in English');
        this.click('#fr');

    }).then(function() {

        test.assertHttpStatus(200);
        test.assertTitleMatch(/Indicatifs/, 'title in French');
        this.click('#en');

    }).then(function() {

        test.assertHttpStatus(200);
        test.assertTitleMatch(/Callsigns/, 'title in English');
        this.click('#fr');

    }).run(function() {

        test.done();

    });

});

// TODO i18n testing
